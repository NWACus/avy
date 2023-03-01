import log from 'logger';
import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {logQueryKey} from 'hooks/logger';
import {AvalancheCenterID, MapLayer, mapLayerSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useMapLayer = (center_id: AvalancheCenterID) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  return useQuery<MapLayer, AxiosError | ZodError>({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id),
    queryFn: async () => fetchMapLayer(nationalAvalancheCenterHost, center_id),
    enabled: !!center_id,
    staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
    cacheTime: Infinity, // hold on to this cached data forever
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string) {
  return logQueryKey(['map-layer', {host: nationalAvalancheCenterHost, center: center_id}]);
}

export const prefetchMapLayer = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id),
    queryFn: async () => {
      Log.prefetch(`prefetching avalanche center map layer for ${center_id}`);
      const result = await fetchMapLayer(nationalAvalancheCenterHost, center_id);
      Log.prefetch(`finished prefetching avalanche center map layer for ${center_id}`);
      return result;
    },
  });
};

const fetchMapLayerQuery = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) =>
  await queryClient.fetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id),
    queryFn: async () => {
      const result = await fetchMapLayer(nationalAvalancheCenterHost, center_id);
      return result;
    },
  });

const fetchMapLayer = async (nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products/map-layer/${center_id}`;
  const {data} = await axios.get(url);

  const parseResult = mapLayerSchema.safeParse(data);
  if (parseResult.success === false) {
    log.warn(`unparsable map layer for avalanche center ${center_id}`, url, parseResult.error, JSON.stringify(data));
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
  fetchQuery: fetchMapLayerQuery,
  prefetch: prefetchMapLayer,
};
