import React, {useEffect, useState} from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from '@sentry/react-native';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {useNACApiVersion} from 'hooks/useNACApiVersion';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {Weather, weatherSchema} from 'types/nationalAvalancheCenter';
import {NACApiVersion, nacUrl} from 'utils/nationalAvalancheCenterApi';
import {ZodError} from 'zod';

export const useWeatherForecast = (forecastId?: number): UseQueryResult<Weather, AxiosError | ZodError> => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);

  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const apiVersion = useNACApiVersion();
  const key = queryKey(nationalAvalancheCenterHost, apiVersion, forecastId ?? 0);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<Weather, AxiosError | ZodError>({
    queryKey: key,
    queryFn: (): Promise<Weather> => fetchWeatherForecast(nationalAvalancheCenterHost, apiVersion, forecastId ?? 0, thisLogger),
    enabled: !!forecastId,
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nationalAvalancheCenterHost: string, apiVersion: NACApiVersion, forecastId: number) {
  return ['weather-forecast', {host: nationalAvalancheCenterHost, apiVersion: apiVersion, forecast: forecastId}];
}

export const prefetchWeatherForecast = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, apiVersion: NACApiVersion, forecastId: number, logger: Logger) => {
  const key = queryKey(nationalAvalancheCenterHost, apiVersion, forecastId);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<Weather> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchWeatherForecast(nationalAvalancheCenterHost, apiVersion, forecastId, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold this in the query cache for a day
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

export const fetchWeatherForecast = async (nationalAvalancheCenterHost: string, apiVersion: NACApiVersion, forecastId: number, logger: Logger): Promise<Weather> => {
  const url = nacUrl(nationalAvalancheCenterHost, apiVersion, `product/${forecastId}`);
  const what = 'weather forecast';
  const thisLogger = logger.child({url: url, what: what});
  const data = await safeFetch(() => axios.get<AxiosResponse<unknown>>(url), thisLogger, what);

  const parseResult = weatherSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        forecastId,
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
  fetch: fetchWeatherForecast,
  prefetch: prefetchWeatherForecast,
};
