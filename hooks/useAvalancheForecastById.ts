import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {logQueryKey} from 'hooks/logger';
import {Product, productSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheForecastById = (fragment: Product) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const forecastId = fragment?.id;

  return useQuery<Product, AxiosError | ZodError>({
    queryKey: queryKey(nationalAvalancheCenterHost, forecastId),
    queryFn: () => fetchProduct(nationalAvalancheCenterHost, forecastId),
    enabled: !!forecastId,
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nationalAvalancheCenterHost: string, forecastId: number) {
  return logQueryKey(['avalanche-forecast', {host: nationalAvalancheCenterHost, forecast: forecastId}]);
}

export const prefetchAvalancheForecast = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, forecastId: number) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, forecastId),
    queryFn: async () => {
      Log.prefetch(`prefetching avalanche forecast ${forecastId}`);
      const result = fetchProduct(nationalAvalancheCenterHost, forecastId);
      Log.prefetch(`finished prefetching avalanche forecast ${forecastId}`);
      return result;
    },
  });
};

// TODO need to export?
export const fetchProduct = async (nationalAvalancheCenterHost: string, forecastId: number) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product/${forecastId}`;
  const {data} = await axios.get(url);

  const parseResult = productSchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn(`unparsable forecast`, url, parseResult.error, JSON.stringify(data));
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