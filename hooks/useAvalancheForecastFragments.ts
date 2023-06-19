import React from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';
import {add, formatDistanceToNowStrict, sub} from 'date-fns';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, ProductFragmentArray, productFragmentArraySchema} from 'types/nationalAvalancheCenter';
import {apiDateString} from 'utils/date';
import {ZodError} from 'zod';

export const useAvalancheForecastFragments = (center_id: AvalancheCenterID, date: Date): UseQueryResult<ProductFragmentArray, AxiosError | ZodError> => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id, date);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<ProductFragmentArray, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<ProductFragmentArray> => fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date, thisLogger),
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string, date: Date) {
  return ['forecast-fragments', {host: nationalAvalancheCenterHost, center: center_id, date: apiDateString(date)}];
}

const prefetchAvalancheForecastFragments = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: string, date: Date, logger: Logger) => {
  const key = queryKey(nationalAvalancheCenterHost, center_id, date);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<ProductFragmentArray> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

const fetchAvalancheForecastFragmentsQuery = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: string,
  date: Date,
  logger: Logger,
): Promise<ProductFragmentArray> => {
  const key = queryKey(nationalAvalancheCenterHost, center_id, date);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return await queryClient.fetchQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date, thisLogger);
      return result;
    },
  });
};

const fetchAvalancheForecastFragments = async (nationalAvalancheCenterHost: string, center_id: string, date: Date, logger: Logger): Promise<ProductFragmentArray> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products`;
  const params = {
    avalanche_center_id: center_id,
    date_start: apiDateString(sub(date, {days: 2})),
    date_end: apiDateString(add(date, {days: 1})),
  };
  const what = 'avalanche forecast fragments';
  const thisLogger = logger.child({url: url, params: params, what: what});
  const data = await safeFetch(
    () =>
      axios.get<AxiosResponse<unknown>>(url, {
        params: params,
      }),
    thisLogger,
    what,
  );

  const parseResult = productFragmentArraySchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
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
    return parseResult.data;
  }
};

export default {
  queryKey,
  prefetch: prefetchAvalancheForecastFragments,
  fetchQuery: fetchAvalancheForecastFragmentsQuery,
};
