import log from 'logger';
import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {logQueryKey} from 'hooks/logger';
import {Observation, observationSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useNACObservation = (id: string) => {
  const {nationalAvalancheCenterHost: host} = React.useContext<ClientProps>(ClientContext);

  return useQuery<Observation, AxiosError | ZodError>({
    queryKey: queryKey(host, id),
    queryFn: () => fetchNACObservation(host, id),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(host: string, id: string) {
  return logQueryKey(['nac-observation', {host, id}]);
}

export const prefetchNACObservation = async (queryClient: QueryClient, host: string, id: string) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(host, id),
    queryFn: async () => {
      Log.prefetch(`prefetching NAC observation ${id}`);
      const result = fetchNACObservation(host, id);
      Log.prefetch(`finished prefetching NAC observation ${id}`);
      return result;
    },
  });
};

export const fetchNACObservation = async (host: string, id: string): Promise<Observation> => {
  const url = `${host}/obs/v1/public/observation/${id}`;
  const {data} = await axios.get(url);

  const parseResult = observationSchema.safeParse(data);
  if (parseResult.success === false) {
    log.warn(`unparsable observation`, url, parseResult.error, JSON.stringify(data));
    // Sentry.Native.captureException(parseResult.error, {
    //   tags: {
    //     zod_error: true,
    //     url,
    //   },
    // });
    // throw parseResult.error;
    // this is probably bullshit
    return data as Observation;
  } else {
    return parseResult.data;
  }
};

export default {
  queryKey,
  fetch: fetchNACObservation,
  prefetch: prefetchNACObservation,
};
