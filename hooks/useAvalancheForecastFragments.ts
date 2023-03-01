import log from 'logger';
import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';
import {add, sub} from 'date-fns';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {logQueryKey} from 'hooks/logger';
import {AvalancheCenterID, Product, productArraySchema} from 'types/nationalAvalancheCenter';
import {apiDateString} from 'utils/date';
import {ZodError} from 'zod';

export const useAvalancheForecastFragments = (center_id: AvalancheCenterID, date: Date) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  return useQuery<Product[] | undefined, AxiosError | ZodError>({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id, date),
    queryFn: async () => fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date),
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string, date: Date) {
  return logQueryKey(['forecast-fragments', {host: nationalAvalancheCenterHost, center: center_id, date: apiDateString(date)}]);
}

const prefetchAvalancheForecastFragments = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: string, date: Date) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id, date),
    queryFn: async () => {
      Log.prefetch(`prefetching forecast fragments for ${center_id} on ${date}`);
      const result = await fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date);
      Log.prefetch(`finished prefetching forecast fragments for ${center_id} on ${date}`);
      return result;
    },
  });
};

const fetchAvalancheForecastFragmentsQuery = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: string, date: Date) =>
  await queryClient.fetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id, date),
    queryFn: async () => {
      const result = await fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date);
      return result;
    },
  });

const fetchAvalancheForecastFragments = async (nationalAvalancheCenterHost: string, center_id: string, date: Date) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products`;
  const params = {
    avalanche_center_id: center_id,
    date_start: apiDateString(sub(date, {days: 2})),
    date_end: apiDateString(add(date, {days: 1})),
  };
  const {data} = await axios.get(url, {
    params: params,
  });

  const parseResult = productArraySchema.safeParse(data);
  if (parseResult.success === false) {
    log.warn('unparsable forecast fragments', url, JSON.stringify(params), parseResult.error, JSON.stringify(data));
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        center_id,
        date: date.toString(),
        url,
      },
    });
    throw parseResult.error;
  } else {
    // TODO(brian): This is assuming that a forecast always exists for the given zone/date range. That's not a good assumption!
    return parseResult.data;
  }
};

export default {
  queryKey,
  prefetch: prefetchAvalancheForecastFragments,
  fetchQuery: fetchAvalancheForecastFragmentsQuery,
};
