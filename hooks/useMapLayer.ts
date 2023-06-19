import React from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, MapLayer, mapLayerSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useMapLayer = (center_id: AvalancheCenterID | undefined): UseQueryResult<MapLayer, AxiosError | ZodError> => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = center_id && queryKey(nationalAvalancheCenterHost, center_id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<MapLayer, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<MapLayer> => (center_id ? fetchMapLayer(nationalAvalancheCenterHost, center_id, thisLogger) : new Promise(() => null)),
    enabled: !!center_id,
    staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
    cacheTime: Infinity, // hold on to this cached data forever
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string) {
  return ['map-layer', {host: nationalAvalancheCenterHost, center: center_id}];
}

export const prefetchMapLayer = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: AvalancheCenterID, logger: Logger) => {
  const key = queryKey(nationalAvalancheCenterHost, center_id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<MapLayer> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchMapLayer(nationalAvalancheCenterHost, center_id, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

const fetchMapLayer = async (nationalAvalancheCenterHost: string, center_id: AvalancheCenterID, logger: Logger): Promise<MapLayer> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products/map-layer/${center_id}`;
  const what = 'avalanche avalanche center map layer';
  const thisLogger = logger.child({url: url, what: what});
  const data = await safeFetch(() => axios.get<AxiosResponse<unknown>>(url), thisLogger, what);

  const parseResult = mapLayerSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        center_id,
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
  prefetch: prefetchMapLayer,
};
