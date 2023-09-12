import React from 'react';

import {QueryClient, useInfiniteQuery} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from 'sentry-expo';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {add, formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {DEFAULT_OBSERVATIONS_WINDOW} from 'hooks/useObservations';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, nwacObservationsListSchema, ObservationFragment} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime, requestedTimeToUTCDate, toDateTimeInterfaceATOM} from 'utils/date';
import {ZodError} from 'zod';

const DEFAULT_PAGE_SIZE = 50;

export const useNWACObservations = (center_id: AvalancheCenterID, endDate: RequestedTime, window: Duration = DEFAULT_OBSERVATIONS_WINDOW) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  // We key on end date, but not window - window merely controls how far we'll fetch backwards
  const key = queryKey(nwacHost, center_id, endDate);
  const windowStart: Date = add(requestedTimeToUTCDate(endDate), window);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');
  const fetchNWACObservationsPage = async (props: {pageParam?: unknown}): Promise<ObservationsQueryWithMeta> => {
    // On the first page, pageParam comes in as null - *not* undefined
    // Subsequent pages come in as numbers that are set by us in getNextPageParam
    const offset = typeof props.pageParam === 'number' ? props.pageParam : 0;
    const limit = DEFAULT_PAGE_SIZE;
    thisLogger.debug('fetching NWAC page', offset, limit, windowStart, requestedTimeToUTCDate(endDate));
    return fetchNWACObservations(nwacHost, center_id, windowStart, requestedTimeToUTCDate(endDate), offset, limit, thisLogger);
  };

  return useInfiniteQuery<ObservationsQueryWithMeta, AxiosError | ZodError>({
    queryKey: key,
    queryFn: fetchNWACObservationsPage,
    getNextPageParam: (lastPage: ObservationsQueryWithMeta) => {
      thisLogger.debug('nwac getNextPageParam', key, JSON.stringify(lastPage.meta, null, 2));
      if (lastPage.meta.next) {
        return lastPage.meta.offset + lastPage.meta.limit;
      } else {
        thisLogger.debug('nwac getNextPageParam', 'no more data available in window!', key, lastPage.meta, windowStart, window);
        return undefined;
      }
    },
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
      const result = fetchNWACObservations(nwacHost, center_id, published_after, published_before, 0, DEFAULT_PAGE_SIZE, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

interface ObservationsQueryWithMeta {
  data: ObservationFragment[];
  published_before: string;
  published_after: string;
  meta: {
    limit: number;
    offset: number;
    next: string | null;
  };
}

export const fetchNWACObservations = async (
  nwacHost: string,
  center_id: AvalancheCenterID,
  published_after: Date,
  published_before: Date,
  offset: number,
  limit: number,
  logger: Logger,
): Promise<ObservationsQueryWithMeta> => {
  if (center_id !== 'NWAC') {
    return {
      published_after: formatRequestedTime(published_after),
      published_before: formatRequestedTime(published_before),
      data: [],
      meta: {
        limit: limit,
        offset: offset,
        next: null,
      },
    };
  }
  const url = `${nwacHost}/api/v2/observations`;
  const params = {
    published_after: toDateTimeInterfaceATOM(published_after),
    published_before: toDateTimeInterfaceATOM(published_before),
    limit: limit,
    offset: offset,
  };
  const what = 'NWAC observations';
  const thisLogger = logger.child({url: url, params: params, what: what});
  thisLogger.debug('fetchNWACObservations', published_after, published_before, offset, limit);
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
    thisLogger.debug('fetchNWACObservations complete', published_after, published_before, parseResult.data.objects.length, parseResult.data.meta);
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
      meta: {
        limit: limit,
        offset: offset,
        next: parseResult.data.meta.next || null,
      },
    };
  }
};

export default {
  queryKey,
  fetch: fetchNWACObservations,
  prefetch: prefetchNWACObservations,
};
