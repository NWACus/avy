import React, {useEffect, useState} from 'react';

import {QueryClient, useInfiniteQuery} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from '@sentry/react-native';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict, sub} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, ObservationFragment, nwacObservationsListSchema} from 'types/nationalAvalancheCenter';
import {RequestedTime, formatRequestedTime, parseRequestedTimeString, requestedTimeToUTCDate, startOfSeasonLocalDate, toDateTimeInterfaceATOM} from 'utils/date';
import {ZodError} from 'zod';

const PAGE_SIZE: Duration = {weeks: 2};

export const useNWACObservations = (center_id: AvalancheCenterID, endDate: RequestedTime, options: {enabled: boolean}) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  // We key on end date, but not window - window merely controls how far we'll fetch backwards
  const key = queryKey(nwacHost, center_id, endDate);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug({endDate, enabled: options.enabled}, 'initiating query');
  }, [thisLogger, endDate, options.enabled]);

  // For NWAC, we fetch in 2 week pages, until we get results that are older than the requested end date minus the lookback window
  const lookbackWindowStart: Date = startOfSeasonLocalDate(endDate);
  const fetchNWACObservationsPage = async (props: {pageParam?: unknown}): Promise<ObservationsQueryWithMeta> => {
    // On the first page, pageParam comes in as null - *not* undefined
    // Subsequent pages come in as strings that are set by us in getNextPageParam
    const pageParam = typeof props.pageParam === 'string' ? props.pageParam : formatRequestedTime(endDate);
    const nextPageEndDate: Date = requestedTimeToUTCDate(parseRequestedTimeString(pageParam));
    const nextPageStartDate = sub(nextPageEndDate, PAGE_SIZE);
    thisLogger.debug({nextPageStartDate, nextPageEndDate, lookbackWindowStart, endDate: requestedTimeToUTCDate(endDate)}, 'fetching NWAC page');
    return fetchNWACObservations(nwacHost, center_id, nextPageStartDate, nextPageEndDate, thisLogger);
  };

  return useInfiniteQuery<ObservationsQueryWithMeta, AxiosError | ZodError>({
    queryKey: key,
    queryFn: fetchNWACObservationsPage,
    getNextPageParam: (lastPage: ObservationsQueryWithMeta) => {
      thisLogger.trace('nwac getNextPageParam', lastPage.startDate);
      if (new Date(lastPage.startDate) > lookbackWindowStart) {
        return lastPage.startDate;
      } else {
        thisLogger.trace('nwac getNextPageParam', 'no more data available in window!', lastPage.startDate, lookbackWindowStart, endDate);
        return undefined;
      }
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    enabled: options.enabled,
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

export const prefetchNWACObservations = async (queryClient: QueryClient, nwacHost: string, center_id: AvalancheCenterID, endDate: Date, logger: Logger) => {
  // when preloading, we're always trying fill the latest data
  const key = queryKey(nwacHost, center_id, 'latest');
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  // we want to fetch a single page of data
  const startDate = sub(endDate, PAGE_SIZE);

  // This will preload 1 page of data into the `latest` query key
  await queryClient.prefetchInfiniteQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchNWACObservations(nwacHost, center_id, startDate, endDate, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold this in the query cache for a day
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

interface ObservationsQueryWithMeta {
  data: ObservationFragment[];
  endDate: string;
  startDate: string;
  meta: {
    next: string | null;
  };
}

export const fetchNWACObservations = async (nwacHost: string, center_id: AvalancheCenterID, startDate: Date, endDate: Date, logger: Logger): Promise<ObservationsQueryWithMeta> => {
  if (center_id !== 'NWAC') {
    return {
      startDate: formatRequestedTime(startDate),
      endDate: formatRequestedTime(endDate),
      data: [],
      meta: {
        next: null,
      },
    };
  }
  const url = `${nwacHost}/api/v2/observations`;
  const params = {
    published_after: toDateTimeInterfaceATOM(startDate),
    published_before: toDateTimeInterfaceATOM(endDate),
    limit: 1000,
  };
  const what = 'NWAC observations';
  const thisLogger = logger.child({url: url, params: params, what: what});
  thisLogger.debug('fetchNWACObservations', startDate, endDate);
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
    Sentry.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    throw parseResult.error;
  } else {
    thisLogger.debug('fetchNWACObservations complete', startDate, endDate, parseResult.data.objects.length, parseResult.data.meta);
    return {
      startDate: formatRequestedTime(startDate),
      endDate: formatRequestedTime(endDate),
      data: parseResult.data.objects.map(object => ({
        id: String(object.id),
        observerType: object.content.observer_type,
        name: object.content.name ?? 'Unknown',
        startDate: object.content.start_date,
        locationName: object.content.location_name ?? 'Unknown',
        instability: object.content.instability,
        observationSummary: object.content.observation_summary ?? 'None',
        locationPoint: object.content.location_point,
        media: object.content.media ?? [],
      })),
      meta: {
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
