import React, {useState} from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from '@sentry/react-native';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {MapLayer, mapLayerSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAllMapLayers = (): UseQueryResult<MapLayer, AxiosError | ZodError> => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost);
  const [thisLogger] = useState(logger.child({query: key}));

  return useQuery<MapLayer, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<MapLayer> => fetchAllMapLayers(nationalAvalancheCenterHost, thisLogger),
    enabled: true,
    cacheTime: Infinity, // hold on to this cached data forever
  });
};

function queryKey(nationalAvalancheCenterHost: string) {
  return ['all-map-layers', {host: nationalAvalancheCenterHost}];
}

export const prefetchAllMapLayers = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, logger: Logger) => {
  const key = queryKey(nationalAvalancheCenterHost);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<MapLayer> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchAllMapLayers(nationalAvalancheCenterHost, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: Infinity, // hold this in the query cache forever
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

const fetchAllMapLayers = async (nationalAvalancheCenterHost: string, logger: Logger): Promise<MapLayer> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products/map-layer?day=`;
  const what = 'avalanche avalanche center map layer';
  const thisLogger = logger.child({url: url, what: what});
  const data = await safeFetch(() => axios.get<AxiosResponse<unknown>>(url), thisLogger, what);

  const parseResult = mapLayerSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.captureException(parseResult.error, {
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
  prefetch: prefetchAllMapLayers,
};
