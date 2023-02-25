import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {logQueryKey} from 'hooks/logger';
import {AvalancheCenter, AvalancheCenterID, avalancheCenterSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheCenterMetadata = (center_id: AvalancheCenterID) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  return useQuery<AvalancheCenter, AxiosError | ZodError>({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id),
    queryFn: async () => fetchAvalancheCenterMetadata(nationalAvalancheCenterHost, center_id),
    staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
    cacheTime: Infinity, // hold on to this cached data forever
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string) {
  return logQueryKey(['center-metadata', {host: nationalAvalancheCenterHost, center: center_id}]);
}

export const prefetchAvalancheCenterMetadata = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id),
    queryFn: async () => {
      Log.prefetch(`prefetching center metadata for ${center_id}`);
      const result = await fetchAvalancheCenterMetadata(nationalAvalancheCenterHost, center_id);
      Log.prefetch(`finished prefetching center metadata for ${center_id}`);
      return result;
    },
  });
};

export const fetchAvalancheCenterMetadataQuery = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) =>
  await queryClient.fetchQuery({
    queryKey: queryKey(nationalAvalancheCenterHost, center_id),
    queryFn: async () => {
      const result = await fetchAvalancheCenterMetadata(nationalAvalancheCenterHost, center_id);
      return result;
    },
  });

const fetchAvalancheCenterMetadata = async (nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/avalanche-center/${center_id}`;
  const {data} = await axios.get(url);

  const parseResult = avalancheCenterSchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn(`unparsable avalanche center ${center_id}`, url, parseResult.error, JSON.stringify(data));
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
  fetchQuery: fetchAvalancheCenterMetadataQuery,
  prefetch: prefetchAvalancheCenterMetadata,
};
