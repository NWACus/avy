import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, MapLayer, mapLayerSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useMapLayer = (center_id: AvalancheCenterID) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<MapLayer, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async () => fetchMapLayer(nationalAvalancheCenterHost, center_id, thisLogger),
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
    queryFn: async () => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchMapLayer(nationalAvalancheCenterHost, center_id, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

const fetchMapLayer = async (nationalAvalancheCenterHost: string, center_id: AvalancheCenterID, logger: Logger) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products/map-layer/${center_id}`;
  const {data} = await axios.get(url);

  const parseResult = mapLayerSchema.safeParse(data);
  if (parseResult.success === false) {
    logger.warn({url: url, error: parseResult.error}, 'unparsable avalanche avalanche center map layer');
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
