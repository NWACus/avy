import React from 'react';

import axios, {AxiosError} from 'axios';
import {QueryClient, useQuery} from 'react-query';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {useAvalancheForecastFragment} from 'hooks/useAvalancheForecastFragment';
import {AvalancheCenterID, Product, productSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheForecast = (center_id: AvalancheCenterID, forecast_zone_id: number, date: Date) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {data: fragment} = useAvalancheForecastFragment(center_id, forecast_zone_id, date);
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
  return ['avalanche-forecast', {host: nationalAvalancheCenterHost, forecast: forecastId}];
}

export const prefetchAvalancheForecast = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, forecastId: number) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, forecastId),
    queryFn: async () => {
      Log.prefetch('starting forecast prefetch');
      const result = fetchProduct(nationalAvalancheCenterHost, forecastId);
      Log.prefetch('forecast request finished');
      return result;
    },
  });
  Log.prefetch(`avalanche forecast ${forecastId} data is cached with react-query`);
};

// TODO need to export?
export const fetchProduct = async (nationalAvalancheCenterHost: string, forecastId: number) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product/${forecastId}`;
  const {data} = await axios.get(url);

  const parseResult = productSchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn(`unparsable forecast`, url, parseResult.error, JSON.stringify(data, null, 2));
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
