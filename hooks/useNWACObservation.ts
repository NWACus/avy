import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {logQueryKey} from 'hooks/logger';
import {Observation, observationSchema} from 'types/nationalAvalancheCenter';
import {z, ZodError} from 'zod';

export const useNWACObservation = (id: number) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);

  return useQuery<Observation, AxiosError | ZodError>({
    queryKey: queryKey(nwacHost, id),
    queryFn: () => fetchNWACObservation(nwacHost, id),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nwacHost: string, id: number) {
  return logQueryKey(['nwac-observation', {host: nwacHost, id: id}]);
}

export const prefetchNWACObservation = async (queryClient: QueryClient, nwacHost: string, id: number) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nwacHost, id),
    queryFn: async () => {
      Log.prefetch(`prefetching NWAC observation ${id}`);
      const result = fetchNWACObservation(nwacHost, id);
      Log.prefetch(`finished prefetching NWAC observation ${id}`);
      return result;
    },
  });
};

const nwacObservationSchema = z.object({
  meta: z.object({
    limit: z.number().optional().nullable(),
    next: z.string().optional().nullable(),
    offset: z.number().optional().nullable(),
    previous: z.string().optional().nullable(),
    total_count: z.number().optional().nullable(),
  }),
  objects: z.object({
    id: z.number(),
    post_type: z.string(),
    post_date: z.string(),
    content: observationSchema.deepPartial(),
  }),
});

export const fetchNWACObservation = async (nwacHost: string, id: number): Promise<Observation> => {
  const url = `${nwacHost}/api/v2/observation/${id}`;
  const {data} = await axios.get(url);

  const parseResult = nwacObservationSchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn(`unparsable observation`, url, parseResult.error, JSON.stringify(data));
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    throw parseResult.error;
  } else {
    parseResult.data.objects.content.created_at = parseResult.data.objects.content.start_date;
    return parseResult.data.objects.content;
  }
};

export default {
  queryKey,
  fetch: fetchNWACObservation,
  prefetch: prefetchNWACObservation,
};
