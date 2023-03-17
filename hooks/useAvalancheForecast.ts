import log from 'logger';
import React from 'react';

import {QueryClient, useQuery, useQueryClient} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {logQueryKey} from 'hooks/logger';
import AvalancheForecastByID from 'hooks/useAvalancheForecastById';
import AvalancheForecastFragment from 'hooks/useAvalancheForecastFragment';
import {AvalancheCenter, AvalancheCenterID, Product, productSchema} from 'types/nationalAvalancheCenter';
import {isNotFound, NotFound} from 'types/requests';
import {nominalForecastDate, nominalForecastDateString, RequestedTime} from 'utils/date';
import {ZodError} from 'zod';

export const useAvalancheForecast = (center_id: AvalancheCenterID, center: AvalancheCenter, zone_id: number, requestedTime: RequestedTime) => {
  const queryClient = useQueryClient();
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);

  const expiryTimeHours = center?.config.expires_time;
  const expiryTimeZone = center?.timezone;

  return useQuery<Product | NotFound, AxiosError | ZodError>({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours),
    queryFn: async () => fetchAvalancheForecast(queryClient, nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours),
    enabled: !!expiryTimeHours,
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

// the query we make to the NAC API does not make use of the nominal date for which we're asking, but we want a good
// user experience around the cut-over moment between nominal dates. Consider a user that has loaded this query before
// the cut-over, and has a cached version of the previous day's forecasts. When they refresh their view after the
// cut-over, we want to render only once we've done a fresh load, since we expect to have new data, instead of using
// the cache. By adding the nominal date to the query key, we get this behavior.
function queryKey(
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  zone_id: number,
  requestedTime: RequestedTime,
  expiryTimeZone: string,
  expiryTimeHours: number,
) {
  let prefix = '';
  let date: Date = null;
  if (requestedTime === 'latest') {
    prefix = 'latest';
    date = new Date();
  } else {
    prefix = 'archived';
    date = requestedTime;
  }
  return logQueryKey([
    `${prefix}-forecast`,
    {
      host: nationalAvalancheCenterHost,
      center: center_id,
      zone_id: zone_id,
      requestedTime: nominalForecastDateString(date, expiryTimeZone, expiryTimeHours),
    },
  ]);
}

const prefetchAvalancheForecast = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  zone_id: number,
  requestedTime: RequestedTime,
  expiryTimeZone: string,
  expiryTimeHours: number,
) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours),
    queryFn: async () => {
      const start = new Date();
      log.debug(`prefetching avalanche forecast`, {center: center_id, zone: zone_id, requestedTime: requestedTime});
      const result = fetchAvalancheForecast(queryClient, nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours);
      log.debug(`finished prefetching avalanche forecast`, {center: center_id, zone: zone_id, requestedTime: requestedTime, duration: formatDistanceToNowStrict(start)});
      return result;
    },
  });
};

const fetchAvalancheForecast = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  zone_id: number,
  requested_time: RequestedTime,
  expiryTimeZone: string,
  expiryTimeHours: number,
) => {
  if (requested_time === 'latest') {
    return fetchLatestAvalancheForecast(nationalAvalancheCenterHost, center_id, zone_id);
  } else {
    const fragment = await AvalancheForecastFragment.fetch(
      queryClient,
      nationalAvalancheCenterHost,
      center_id,
      zone_id,
      nominalForecastDate(requested_time, expiryTimeZone, expiryTimeHours),
    );
    if (isNotFound(fragment)) {
      return fragment;
    } else {
      return await AvalancheForecastByID.fetch(nationalAvalancheCenterHost, fragment.id);
    }
  }
};

const fetchLatestAvalancheForecast = async (nationalAvalancheCenterHost: string, center_id: string, zone_id: number) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product`;
  const params = {
    center_id: center_id,
    type: 'forecast',
    zone_id: zone_id,
  };
  const {data} = await axios.get(url, {
    params: params,
  });

  const parseResult = productSchema.safeParse(data);
  if (parseResult.success === false) {
    log.warn('unparsable avalanche forecast', {url: url, params: params, center: center_id, zone: zone_id, requestedTime: 'latest', error: parseResult.error});
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        center_id,
        zone_id,
        url,
      },
    });
    throw parseResult.error;
  } else {
    return parseResult.data;
  }
};

export default {
  queryKey: queryKey,
  fetch: fetchAvalancheForecast,
  prefetch: prefetchAvalancheForecast,
};
