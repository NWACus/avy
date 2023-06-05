import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {Observation, observationSchema} from 'types/nationalAvalancheCenter';
import {z, ZodError} from 'zod';

export const useNWACObservation = (id: number) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nwacHost, id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<Observation, AxiosError | ZodError>({
    queryKey: key,
    queryFn: () => fetchNWACObservation(nwacHost, id, thisLogger),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nwacHost: string, id: number) {
  return ['nwac-observation', {host: nwacHost, id: id}];
}

export const prefetchNWACObservation = async (queryClient: QueryClient, nwacHost: string, id: number, logger: Logger) => {
  const key = queryKey(nwacHost, id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');
  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchNWACObservation(nwacHost, id, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
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

export const fetchNWACObservation = async (nwacHost: string, id: number, logger: Logger): Promise<Observation> => {
  const url = `${nwacHost}/api/v2/observation/${id}`;
  const thisLogger = logger.child({url: url, id: id, what: 'NWAC observation'});
  const data = await safeFetch(() => axios.get(url), thisLogger);

  const parseResult = nwacObservationSchema.safeParse(data);
  if (parseResult.success === false) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    throw parseResult.error;
  } else {
    return parseResult.data.objects.content;
  }
};

export default {
  queryKey,
  fetch: fetchNWACObservation,
  prefetch: prefetchNWACObservation,
};
