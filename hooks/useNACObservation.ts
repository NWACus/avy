import React from 'react';

import * as Sentry from 'sentry-expo';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {Observation, observationSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useNACObservation = (id: string) => {
  const {nationalAvalancheCenterHost: host} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(host, id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<Observation, AxiosError | ZodError>({
    queryKey: key,
    queryFn: () => fetchNACObservation(host, id, thisLogger),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(host: string, id: string) {
  return ['nac-observation', {host, id}];
}

export const prefetchNACObservation = async (queryClient: QueryClient, host: string, id: string, logger: Logger) => {
  const key = queryKey(host, id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      logger.trace(`prefetching`);
      const result = fetchNACObservation(host, id, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

export const fetchNACObservation = async (host: string, id: string, logger: Logger): Promise<Observation> => {
  const url = `${host}/obs/v1/public/observation/${id}`;
  const thisLogger = logger.child({url: url, what: 'NAC observation'});
  const data = await safeFetch(() => axios.get(url), thisLogger);

  const parseResult = observationSchema.deepPartial().safeParse(data);
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
    return parseResult.data;
  }
};

export default {
  queryKey,
  fetch: fetchNACObservation,
  prefetch: prefetchNACObservation,
};
