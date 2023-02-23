import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {AvalancheCenterID, Product, productSchema} from 'types/nationalAvalancheCenter';
import {nominalForecastDate} from 'utils/date';
import {ZodError} from 'zod';

export const useLatestAvalancheForecast = (center_id: AvalancheCenterID, zone_id: number, requestedTime: Date) => {
  const {data: metadata} = useAvalancheCenterMetadata(center_id);
  const expiryTimeHours = metadata?.config.expires_time;
  const expiryTimeZone = metadata?.timezone;

  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  return useQuery<Product, AxiosError | ZodError>({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours),
    queryFn: async () => fetchLatestAvalancheForecast(nationalAvalancheCenterHost, center_id, zone_id),
    enabled: !!expiryTimeHours,
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

// the query we make to the NAC API does not make use of the nominal date for which we're asking, but we want a good
// user experience around the cut-over moment between nominal dates. Consider a user that has loaded this query before
// the cut-over, and has a cached version of the previous day's forecasts. When they refresh their view after the
// cut-over, we want to render only once we've done a fresh load, since we expect to have new data, instead of using
// the cache. By adding the nominal date to the query key, we get this behavior.
function queryKey(nationalAvalancheCenterHost: string, center_id: string, zone_id: number, requestedTime: Date, expiryTimeZone: string, expiryTimeHours: number) {
  return [
    'latest-forecast',
    {
      host: nationalAvalancheCenterHost,
      center: center_id,
      zone_id: zone_id,
      requestedTime: nominalForecastDate(requestedTime, expiryTimeZone, expiryTimeHours),
    },
  ];
}

const prefetchLatestAvalancheForecast = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: string,
  zone_id: number,
  requestedTime: Date,
  expiryTimeZone: string,
  expiryTimeHours: number,
) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours),
    queryFn: async () => {
      Log.prefetch(`prefetching latest avalanche forecast for ${center_id} at ${requestedTime}`);
      const result = await fetchLatestAvalancheForecast(nationalAvalancheCenterHost, center_id, zone_id);
      Log.prefetch(`finished prefetching latest avalanche forecast for ${center_id} at ${requestedTime}`);
      return result;
    },
  });
};

const fetchLatestAvalancheForecast = async (nationalAvalancheCenterHost: string, center_id: string, zone_id: number) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product`;
  const {data} = await axios.get(url, {
    params: {
      center_id: center_id,
      type: 'forecast',
      zone_id: zone_id,
    },
  });

  const parseResult = productSchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn('unparsable forecast', url, parseResult.error, JSON.stringify(data, null, 2));
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
  queryKey,
  fetch: fetchLatestAvalancheForecast,
  prefetch: prefetchLatestAvalancheForecast,
};
