import React, {useEffect, useState} from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from '@sentry/react-native';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {NWACWeatherForecastDay} from 'types/nwacWeather/nwacWeather';
import {nwacWeatherZoneResponseSchema} from 'types/nwacWeather/schemas';
import {NotFoundError} from 'types/requests';
import {ZodError} from 'zod';

export const useNWACWeatherForecast = (
  zone_id: number,
  avalancheForecastPublishedTime: string | undefined,
): UseQueryResult<NWACWeatherForecastDay, AxiosError | ZodError | NotFoundError> => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nwacHost, zone_id, avalancheForecastPublishedTime ?? '');
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<NWACWeatherForecastDay, AxiosError | ZodError | NotFoundError>({
    queryKey: key,
    queryFn: () => fetchNWACWeatherForecast(nwacHost, zone_id, avalancheForecastPublishedTime ?? '', thisLogger),
    enabled: !!avalancheForecastPublishedTime,
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nwacHost: string, zone_id: number, avalancheForecastPublishedTime: string) {
  return [
    'nwac-weather',
    {
      host: nwacHost,
      zone_id: zone_id,
      published: avalancheForecastPublishedTime,
    },
  ];
}

export const prefetchNWACWeatherForecast = async (queryClient: QueryClient, nwacHost: string, zone_id: number, avalancheForecastPublishedTime: string, logger: Logger) => {
  const key = queryKey(nwacHost, zone_id, avalancheForecastPublishedTime);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchNWACWeatherForecast(nwacHost, zone_id, avalancheForecastPublishedTime, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold this in the query cache for a day
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

export const fetchNWACWeatherForecast = async (nwacHost: string, zone_id: number, avalancheForecastPublishedTime: string, logger: Logger): Promise<NWACWeatherForecastDay> => {
  const url = `${nwacHost}/api/nwac/nwac-weather-zone`;
  const params = {
    zone: zone_id,
    published: avalancheForecastPublishedTime,
  };
  const what = 'NWAC weather forecast';
  const thisLogger = logger.child({url: url, params: params, what: what});
  const data = await safeFetch(
    () =>
      axios.get<AxiosResponse<unknown>>(url, {
        params: params,
      }),
    thisLogger,
    what,
  );

  const parseResult = nwacWeatherZoneResponseSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    throw parseResult.error;
  } else if (!parseResult.data.day) {
    throw new NotFoundError(`no NWAC weather forecast for zone ${zone_id} published at or before ${params.published}`, what);
  } else {
    return parseResult.data.day;
  }
};

export default {
  queryKey,
  fetch: fetchNWACWeatherForecast,
  prefetch: prefetchNWACWeatherForecast,
};
