import React from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {nwacObservationResultSchema, Observation} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useNWACObservation = (id: number): UseQueryResult<Observation, AxiosError | ZodError> => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nwacHost, id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<Observation, AxiosError | ZodError>({
    queryKey: key,
    queryFn: (): Promise<Observation> => fetchNWACObservation(nwacHost, id, thisLogger),
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

export const fetchNWACObservation = async (nwacHost: string, id: number, logger: Logger): Promise<Observation> => {
  const url = `${nwacHost}/api/v2/observation/${id}`;
  const what = 'NWAC observation';
  const thisLogger = logger.child({url: url, id: id, what: what});
  const data = await safeFetch(() => axios.get<AxiosResponse<unknown>>(url), thisLogger, what);

  const parseResult = nwacObservationResultSchema.safeParse(data);
  if (!parseResult.success) {
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
