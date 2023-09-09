import React from 'react';

import {QueryClient, useInfiniteQuery} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict, sub} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, nwacObservationsListSchema, ObservationFragment} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, parseRequestedTimeString, RequestedTime, requestedTimeToUTCDate, toDateTimeInterfaceATOM} from 'utils/date';
import {ZodError} from 'zod';

export const useNWACObservations = (center_id: AvalancheCenterID, endDate: RequestedTime) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nwacHost, center_id, endDate);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');
  const fetchNWACObservationsPage = async (props: {pageParam?: unknown}): Promise<ObservationsQueryWithMeta> => {
    // On the first page, pageParam comes in as null - *not* undefined
    // Subsequent pages come in as strings that are set by us in getNextPageParam
    const pageParam = typeof props.pageParam === 'string' ? props.pageParam : formatRequestedTime(endDate);
    const pageEndDate: Date = requestedTimeToUTCDate(parseRequestedTimeString(pageParam));
    const pageStartDate = sub(pageEndDate, {weeks: 2});
    return fetchNWACObservations(nwacHost, center_id, pageStartDate, pageEndDate, thisLogger);
  };

  return useInfiniteQuery<ObservationsQueryWithMeta, AxiosError | ZodError>({
    queryKey: key,
    queryFn: fetchNWACObservationsPage,
    getNextPageParam: lastPage => lastPage.published_after,
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nwacHost: string, center_id: AvalancheCenterID, end_time: RequestedTime) {
  return [
    'nwac-observations',
    {
      host: nwacHost,
      center_id: center_id,
      end_time: formatRequestedTime(end_time),
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
  // when preloading, we're always trying fill the latest data
  const key = queryKey(nwacHost, center_id, 'latest');
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchInfiniteQuery({
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

interface ObservationsQueryWithMeta {
  data: ObservationFragment[];
  published_before: string;
  published_after: string;
}

export const fetchNWACObservations = async (
  nwacHost: string,
  center_id: AvalancheCenterID,
  published_after: Date,
  published_before: Date,
  logger: Logger,
): Promise<ObservationsQueryWithMeta> => {
  if (center_id !== 'NWAC') {
    return {
      published_after: formatRequestedTime(published_after),
      published_before: formatRequestedTime(published_before),
      data: [],
    };
  }
  const url = `${nwacHost}/api/v2/observations`;
  const params = {
    published_after: toDateTimeInterfaceATOM(published_after),
    published_before: toDateTimeInterfaceATOM(published_before),
  };
  const what = 'NWAC observations';
  const thisLogger = logger.child({url: url, params: params, what: what});
  const data = await safeFetch(
    () =>
      axios.get<AxiosResponse<unknown>>(url, {
        params: params,
      }),
    thisLogger,
    what,
  );

  const parseResult = nwacObservationsListSchema.safeParse(data);
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
    return {
      published_after: formatRequestedTime(published_after),
      published_before: formatRequestedTime(published_before),
      data: parseResult.data.objects.map(object => ({
        id: String(object.id),
        observerType: object.content.observer_type,
        name: object.content.name ?? 'Unknown',
        createdAt: object.post_date,
        locationName: object.content.location_name ?? 'Unknown',
        instability: object.content.instability,
        observationSummary: object.content.observation_summary ?? 'None',
        locationPoint: object.content.location_point,
        media: object.content.media ?? [],
      })),
    };
  }
};

export default {
  queryKey,
  fetch: fetchNWACObservations,
  prefetch: prefetchNWACObservations,
};
