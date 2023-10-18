import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {ForecastResult, forecastResultSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheForecastById = (fragment: ForecastResult) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const forecastId = fragment?.id;

  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, forecastId);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<ForecastResult, AxiosError | ZodError>({
    queryKey: key,
    queryFn: (): Promise<ForecastResult> => fetchForecast(nationalAvalancheCenterHost, forecastId, thisLogger),
    enabled: !!forecastId,
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nationalAvalancheCenterHost: string, forecastId: number) {
  return ['avalanche-forecast', {host: nationalAvalancheCenterHost, forecast: forecastId}];
}

export const prefetchAvalancheForecast = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, forecastId: number, logger: Logger) => {
  const key = queryKey(nationalAvalancheCenterHost, forecastId);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<ForecastResult> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchForecast(nationalAvalancheCenterHost, forecastId, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

export const fetchForecast = async (nationalAvalancheCenterHost: string, forecastId: number, logger: Logger): Promise<ForecastResult> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product/${forecastId}`;
  const what = 'avalanche forecast';
  const thisLogger = logger.child({url: url, what: what});
  const data = await safeFetch(() => axios.get<AxiosResponse<unknown>>(url), thisLogger, what);

  const parseResult = forecastResultSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.Native.captureException(parseResult.error, {
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
  fetch: fetchForecast,
  prefetch: prefetchAvalancheForecast,
};
