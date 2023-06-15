import React from 'react';

import {QueryClient, useInfiniteQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict, sub} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {ObservationsDocument, ObservationsQuery} from 'hooks/useObservations';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {apiDateString, formatRequestedTime, parseRequestedTimeString, requestedTimeToUTCDate} from 'utils/date';
import {ZodError} from 'zod';

export const useNACObservations = (center_id: AvalancheCenterID, endDate: Date) => {
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

interface ObservationsQueryWithMeta extends ObservationsQuery {
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
  const thisLogger = logger.child({url: url, variables: variables, what: 'NAC observations'});
  const data = await safeFetch(
    () =>
      axios.post(
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
  );

  if (data.error) {
    logger.warn({error: data.error}, `error response on fetch`);
    throw new Error(`GraphQL error response: ${JSON.stringify(data.error)}`);
  }

  // TODO(skuznets): we're not validating the response with Zod since we can trust the GraphQL layer, as long
  // as our clients are up-to-date. Is this sufficient? Should we do more?
  return {
    startDate: formatRequestedTime(startDate),
    endDate: formatRequestedTime(endDate),
    ...(data.data as ObservationsQuery),
  };
};

export default {
  queryKey,
  fetch: fetchNACObservations,
  prefetch: prefetchNACObservations,
};
