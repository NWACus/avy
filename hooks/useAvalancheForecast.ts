import React from 'react';

import {QueryClient, useQuery, useQueryClient} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import AvalancheForecastByID from 'hooks/useAvalancheForecastById';
import AvalancheForecastFragment from 'hooks/useAvalancheForecastFragment';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenter, AvalancheCenterID, Product, productSchema} from 'types/nationalAvalancheCenter';
import {isNotFound, NotFound} from 'types/requests';
import {nominalForecastDate, nominalForecastDateString, RequestedTime} from 'utils/date';
import {ZodError} from 'zod';

export const useAvalancheForecast = (center_id: AvalancheCenterID, center: AvalancheCenter, zone_id: number, requestedTime: RequestedTime) => {
  const expiryTimeHours = center?.config.expires_time;
  const expiryTimeZone = center?.timezone;

  const queryClient = useQueryClient();
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<Product | NotFound, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async () => fetchAvalancheForecast(queryClient, nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours, thisLogger),
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
  return [
    `${prefix}-forecast`,
    {
      host: nationalAvalancheCenterHost,
      center: center_id,
      zone_id: zone_id,
      requestedTime: nominalForecastDateString(date, expiryTimeZone, expiryTimeHours),
    },
  ];
}

const prefetchAvalancheForecast = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  zone_id: number,
  requestedTime: RequestedTime,
  expiryTimeZone: string,
  expiryTimeHours: number,
  logger: Logger,
) => {
  const key = queryKey(nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      logger.trace(`prefetching`);
      const result = fetchAvalancheForecast(queryClient, nationalAvalancheCenterHost, center_id, zone_id, requestedTime, expiryTimeZone, expiryTimeHours, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
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
  logger: Logger,
) => {
  if (requested_time === 'latest') {
    return fetchLatestAvalancheForecast(nationalAvalancheCenterHost, center_id, zone_id, logger);
  } else {
    const fragment = await AvalancheForecastFragment.fetch(
      queryClient,
      nationalAvalancheCenterHost,
      center_id,
      zone_id,
      nominalForecastDate(requested_time, expiryTimeZone, expiryTimeHours),
      logger,
    );
    if (isNotFound(fragment)) {
      return fragment;
    } else {
      return await AvalancheForecastByID.fetch(nationalAvalancheCenterHost, fragment.id, logger);
    }
  }
};

const fetchLatestAvalancheForecast = async (nationalAvalancheCenterHost: string, center_id: string, zone_id: number, logger: Logger) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product`;
  const params = {
    center_id: center_id,
    type: 'forecast',
    zone_id: zone_id,
  };
  const thisLogger = logger.child({url: url, params: params, what: 'avalanche forecast'});
  const data = await safeFetch(
    () =>
      axios.get(url, {
        params: params,
      }),
    thisLogger,
  );

  const parseResult = productSchema.safeParse(data);
  if (parseResult.success === false) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
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
