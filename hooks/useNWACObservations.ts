import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {ObservationsQuery} from 'hooks/useObservations';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, observationSchema} from 'types/nationalAvalancheCenter';
import {toDateTimeInterfaceATOM} from 'utils/date';
import {z, ZodError} from 'zod';

export const useNWACObservations = (center_id: AvalancheCenterID, published_after: Date, published_before: Date) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nwacHost, center_id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<ObservationsQuery, AxiosError | ZodError>({
    queryKey: key,
    queryFn: () => fetchNWACObservations(nwacHost, center_id, published_after, published_before, thisLogger),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nwacHost: string, center_id: AvalancheCenterID) {
  return [
    'nwac-observations',
    {
      host: nwacHost,
      center_id: center_id,
    },
  ];
}

export const prefetchNWACObservations = async (
  queryClient: QueryClient,
  nwacHost: string,
  center_id: AvalancheCenterID,
  published_after: Date,
  published_before: Date,
  logger: Logger,
) => {
  const key = queryKey(nwacHost, center_id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      logger.trace(`prefetching`);
      const result = fetchNWACObservations(nwacHost, center_id, published_after, published_before, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

const nwacObservationsSchema = z.object({
  meta: z.object({
    limit: z.number().optional().nullable(),
    next: z.string().optional().nullable(),
    offset: z.number().optional().nullable(),
    previous: z.string().optional().nullable(),
    total_count: z.number().optional().nullable(),
  }),
  objects: z.array(
    z.object({
      id: z.number(),
      post_type: z.string(),
      post_date: z.string(),
      content: observationSchema.deepPartial(),
    }),
  ),
});

export const fetchNWACObservations = async (
  nwacHost: string,
  center_id: AvalancheCenterID,
  published_after: Date,
  published_before: Date,
  logger: Logger,
): Promise<ObservationsQuery> => {
  if (center_id !== 'NWAC') {
    return {getObservationList: []};
  }
  const url = `${nwacHost}/api/v2/observations`;
  const params = {
    published_after: toDateTimeInterfaceATOM(published_after),
    published_before: toDateTimeInterfaceATOM(published_before),
  };
  const thisLogger = logger.child({url: url, params: params, what: 'NWAC observations'});
  const data = await safeFetch(
    () =>
      axios.get(url, {
        params: params,
      }),
    thisLogger,
  );

  const parseResult = nwacObservationsSchema.safeParse(data);
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
    return {
      getObservationList: parseResult.data.objects.map(object => ({
        id: String(object.id),
        observerType: object.content.observer_type,
        name: object.content.name,
        createdAt: object.content.created_at,
        locationName: object.content.location_name,
        instability: object.content.instability,
        observationSummary: object.content.observation_summary,
        locationPoint: object.content.location_point,
        media: object.content.media,
      })),
    };
  }
};

export default {
  queryKey,
  fetch: fetchNWACObservations,
  prefetch: prefetchNWACObservations,
};
