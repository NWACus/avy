import React from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AllAvalancheCenterCapabilities, allAvalancheCenterCapabilitiesSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheCenterCapabilities = (): UseQueryResult<AllAvalancheCenterCapabilities, AxiosError | ZodError> => {
  const {nationalAvalancheCenterWordpressHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterWordpressHost);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<AllAvalancheCenterCapabilities, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<AllAvalancheCenterCapabilities> => fetchAvalancheCenterCapabilities(nationalAvalancheCenterWordpressHost, thisLogger),
    staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
    cacheTime: Infinity, // hold on to this cached data forever
  });
};

function queryKey(nationalAvalancheCenterWordpressHost: string) {
  return ['center-capabilities', {host: nationalAvalancheCenterWordpressHost}];
}

export const prefetchAvalancheCenterCapabilities = async (queryClient: QueryClient, nationalAvalancheCenterWordpressHost: string, logger: Logger) => {
  const key = queryKey(nationalAvalancheCenterWordpressHost);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<AllAvalancheCenterCapabilities> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchAvalancheCenterCapabilities(nationalAvalancheCenterWordpressHost, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

export const fetchAvalancheCenterCapabilitiesQuery = async (queryClient: QueryClient, nationalAvalancheCenterWordpressHost: string, logger: Logger) =>
  await queryClient.fetchQuery({
    queryKey: queryKey(nationalAvalancheCenterWordpressHost),
    queryFn: async (): Promise<AllAvalancheCenterCapabilities> => {
      const result = await fetchAvalancheCenterCapabilities(nationalAvalancheCenterWordpressHost, logger);
      return result;
    },
  });

const fetchAvalancheCenterCapabilities = async (nationalAvalancheCenterWordpressHost: string, logger: Logger): Promise<AllAvalancheCenterCapabilities> => {
  const url = nationalAvalancheCenterWordpressHost;
  const params = {
    rest_route: '/v1/public/avalanche-centers/',
  };
  const what = 'avalanche center metadata';
  const thisLogger = logger.child({url: url, params: params, what: what});
  const data = await safeFetch(() => axios.get<AxiosResponse<unknown>>(url, {params: params}), thisLogger, what);

  const parseResult = allAvalancheCenterCapabilitiesSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({url: url, error: parseResult.error}, 'failed to parse');
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
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
  fetchQuery: fetchAvalancheCenterCapabilitiesQuery,
  prefetch: prefetchAvalancheCenterCapabilities,
};
