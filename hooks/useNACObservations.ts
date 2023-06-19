import React from 'react';

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
import {apiDateString, formatRequestedTime, parseRequestedTimeString, RequestedTime, requestedTimeToUTCDate} from 'utils/date';
import {ZodError} from 'zod';

export const useNACObservations = (center_id: AvalancheCenterID, endDate: RequestedTime) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');
  const fetchNACObservationsPage = async ({pageParam = formatRequestedTime(endDate)}): Promise<ObservationsQueryWithMeta> => {
    const endDate: Date = requestedTimeToUTCDate(parseRequestedTimeString(pageParam));
    const startDate = sub(endDate, {weeks: 2});
    return fetchNACObservations(nationalAvalancheCenterHost, center_id, startDate, endDate, thisLogger);
  };

  return useInfiniteQuery<ObservationsQueryWithMeta, AxiosError | ZodError>({
    queryKey: key,
    queryFn: fetchNACObservationsPage,
    getNextPageParam: lastPage => lastPage.startDate,
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: AvalancheCenterID) {
  return [
    'nac-observations',
    {
      host: nationalAvalancheCenterHost,
      center_id: center_id,
    },
  ];
}

export const prefetchNACObservations = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  startDate: Date,
  endDate: Date,
  logger: Logger,
) => {
  const key = queryKey(nationalAvalancheCenterHost, center_id);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchInfiniteQuery({
    queryKey: key,
    queryFn: async (): Promise<ObservationsQueryWithMeta> => {
      const start = new Date();
      logger.trace(`prefetching`);
      const result = fetchNACObservations(nationalAvalancheCenterHost, center_id, startDate, endDate, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
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
