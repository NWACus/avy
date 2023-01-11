import React from 'react';

import axios, {AxiosError} from 'axios';
import {QueryClient, useQuery} from 'react-query';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from 'clientContext';
import {AvalancheCenter, AvalancheCenterID, avalancheCenterSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheCenterMetadata = (center_id: AvalancheCenterID) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  return useQuery<AvalancheCenter, AxiosError | ZodError>({
    queryKey: queryKey(center_id),
    queryFn: async () => fetchAvalancheCenterMetadata(nationalAvalancheCenterHost, center_id),
    staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
    cacheTime: Infinity, // hold on to this cached data forever
  });
};

function queryKey(center_id: string) {
  return ['avalanche-center', center_id];
}

export const prefetchAvalancheCenterMetadata = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(center_id),
    queryFn: async () => {
      console.log('starting metadata prefetch');
      const result = await fetchAvalancheCenterMetadata(nationalAvalancheCenterHost, center_id);
      console.log('metadata request finished');
      return result;
    },
  });
  console.log('avalanche center metadata is cached with react-query');
};

export const fetchAvalancheCenterMetadata = async (nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/avalanche-center/${center_id}`;
  const {data} = await axios.get(url);

  const parseResult = avalancheCenterSchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn(`unparsable avalanche center ${center_id}`, url, parseResult.error, JSON.stringify(data, null, 2));
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
  fetch: fetchAvalancheCenterMetadata,
  prefetch: prefetchAvalancheCenterMetadata,
};
