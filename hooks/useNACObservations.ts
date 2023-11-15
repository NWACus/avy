import React, {useEffect, useState} from 'react';

import * as Sentry from 'sentry-expo';

import {QueryClient, useInfiniteQuery} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict, sub} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {ObservationsDocument} from 'hooks/useObservations';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, ObservationFragment, observationListResultSchema} from 'types/nationalAvalancheCenter';
import {RequestedTime, apiDateString, formatRequestedTime, parseRequestedTimeString, requestedTimeToUTCDate, startOfSeasonLocalDate} from 'utils/date';
import {ZodError} from 'zod';

const PAGE_SIZE: Duration = {weeks: 2};

export const useNACObservations = (center_id: AvalancheCenterID, endDate: RequestedTime, options: {enabled: boolean}) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id, endDate);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug({endDate, enabled: options.enabled}, 'initiating query');
  }, [thisLogger, endDate, options.enabled]);

  // For NAC, we fetch in 2 week pages, until we get results that are older than the requested end date minus the lookback window
  const lookbackWindowStart: Date = startOfSeasonLocalDate(endDate);
  const fetchNACObservationsPage = async (props: {pageParam?: unknown}): Promise<ObservationsQueryWithMeta> => {
    // On the first page, pageParam comes in as null - *not* undefined
    // Subsequent pages come in as strings that are set by us in getNextPageParam
    const pageParam = typeof props.pageParam === 'string' ? props.pageParam : formatRequestedTime(endDate);
    const pageEndDate: Date = requestedTimeToUTCDate(parseRequestedTimeString(pageParam));
    const pageStartDate = sub(pageEndDate, PAGE_SIZE);
    thisLogger.debug({pageStartDate, pageEndDate, lookbackWindowStart, endDate: requestedTimeToUTCDate(endDate)}, 'fetching NAC page');
    return fetchNACObservations(nationalAvalancheCenterHost, center_id, pageStartDate, pageEndDate, thisLogger);
  };

  return useInfiniteQuery<ObservationsQueryWithMeta, AxiosError | ZodError>({
    queryKey: key,
    queryFn: fetchNACObservationsPage,
    getNextPageParam: (lastPage: ObservationsQueryWithMeta) => {
      thisLogger.trace('nac getNextPageParam', lastPage.startDate);
      if (new Date(lastPage.startDate) > lookbackWindowStart) {
        return lastPage.startDate;
      } else {
        thisLogger.trace('nac getNextPageParam', 'no more pages!', lastPage.startDate, lookbackWindowStart, endDate);
        return undefined;
      }
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    enabled: options.enabled,
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: AvalancheCenterID, end_time: RequestedTime) {
  return [
    'nac-observations',
    {
      host: nationalAvalancheCenterHost,
      center_id: center_id,
      end_time: formatRequestedTime(end_time),
    },
  ];
}

export const prefetchNACObservations = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: AvalancheCenterID, endDate: Date, logger: Logger) => {
  // when preloading, we're always trying fill the latest data
  const key = queryKey(nationalAvalancheCenterHost, center_id, 'latest');
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  // we want to fetch a single page of data
  const startDate = sub(endDate, PAGE_SIZE);

  await queryClient.prefetchInfiniteQuery({
    queryKey: key,
    queryFn: async (): Promise<ObservationsQueryWithMeta> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchNACObservations(nationalAvalancheCenterHost, center_id, startDate, endDate, thisLogger);
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
}

export const fetchNACObservations = async (
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  startDate: Date,
  endDate: Date,
  logger: Logger,
): Promise<ObservationsQueryWithMeta> => {
  const url = `${nationalAvalancheCenterHost}/obs/v1/public/graphql`;
  const variables = {
    center: center_id,
    startDate: apiDateString(startDate),
    endDate: apiDateString(endDate),
  };
  const what = 'NAC observations';
  const thisLogger = logger.child({url: url, variables: variables, what: what});
  const data = await safeFetch(
    () =>
      axios.post<AxiosResponse<unknown>>(
        url,
        {
          query: ObservationsDocument,
          variables: variables,
        },
        {
          headers: {
            // Public API uses the Origin header to determine who's authorized to call it
            Origin: 'https://nwac.us',
          },
        },
      ),
    thisLogger,
    what,
  );

  const parseResult = observationListResultSchema.safeParse(data);
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
    if (parseResult.data.errors) {
      logger.warn({error: parseResult.data.errors}, `error response on fetch`);
      throw new Error(`GraphQL error response: ${JSON.stringify(parseResult.data.errors)}`);
    }
    logger.debug(
      {observationCount: (parseResult.data.data?.getObservationList ?? []).length, startDate: formatRequestedTime(startDate), endDate: formatRequestedTime(endDate)},
      `observation page fetch complete`,
    );
    return {
      data: parseResult.data.data?.getObservationList ?? [],
      startDate: formatRequestedTime(startDate),
      endDate: formatRequestedTime(endDate),
    };
  }
};

export default {
  queryKey,
  fetch: fetchNACObservations,
  prefetch: prefetchNACObservations,
};
