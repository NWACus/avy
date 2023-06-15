import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {Product, productSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheForecastById = (fragment: Product) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const forecastId = fragment?.id;

  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, forecastId);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<Product, AxiosError | ZodError>({
    queryKey: key,
    queryFn: (): Promise<Product> => fetchProduct(nationalAvalancheCenterHost, forecastId, thisLogger),
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
    queryFn: async (): Promise<Product> => {
      const start = new Date();
      logger.trace(`prefetching`);
      const result = fetchProduct(nationalAvalancheCenterHost, forecastId, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

// TODO need to export?
export const fetchProduct = async (nationalAvalancheCenterHost: string, forecastId: number, logger: Logger): Promise<Product> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product/${forecastId}`;
  const thisLogger = logger.child({url: url, what: 'avalanche forecast'});
  const data = await safeFetch(() => axios.get(url), thisLogger);

  const parseResult = productSchema.safeParse(data);
  if (parseResult.success === false) {
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
  fetch: fetchProduct,
  prefetch: prefetchAvalancheForecast,
};
