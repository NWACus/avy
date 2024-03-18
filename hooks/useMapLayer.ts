import React, {useEffect, useState} from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from '@sentry/react-native';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, MapLayer, mapLayerSchema} from 'types/nationalAvalancheCenter';
import {apiDateString, RequestedTime, requestedTimeToUTCDate} from 'utils/date';
import {ZodError} from 'zod';

export const useMapLayer = (center_id: AvalancheCenterID | undefined, requestedTime: RequestedTime | undefined): UseQueryResult<MapLayer, AxiosError | ZodError> => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = center_id && requestedTime && queryKey(nationalAvalancheCenterHost, center_id, requestedTime);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<MapLayer, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<MapLayer> =>
      center_id && requestedTime ? fetchMapLayer(nationalAvalancheCenterHost, center_id, requestedTime, thisLogger) : new Promise(() => null),
    enabled: !!center_id && !!requestedTime,
    cacheTime: Infinity, // hold on to this cached data forever
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string, requestedTime: RequestedTime) {
  return [`map-layer`, {host: nationalAvalancheCenterHost, center: center_id, requestedTime: requestedTime}];
}

export const prefetchMapLayer = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  requestedTime: RequestedTime,
  logger: Logger,
) => {
  const key = queryKey(nationalAvalancheCenterHost, center_id, requestedTime);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<MapLayer> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchMapLayer(nationalAvalancheCenterHost, center_id, requestedTime, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: Infinity, // hold this in the query cache forever
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

const fetchMapLayer = async (nationalAvalancheCenterHost: string, center_id: AvalancheCenterID, requestedTime: RequestedTime, logger: Logger): Promise<MapLayer> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products/map-layer/${center_id}`;
  const params =
    requestedTime === 'latest'
      ? {}
      : {
          day: apiDateString(requestedTimeToUTCDate(requestedTime)),
        };
  const what = 'avalanche avalanche center map layer';
  const thisLogger = logger.child({url: url, params: params, what: what});
  const data = await safeFetch(
    () =>
      axios.get<AxiosResponse<unknown>>(url, {
        params: params,
      }),
    thisLogger,
    what,
  );

  const parseResult = mapLayerSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        center_id,
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
  prefetch: prefetchMapLayer,
};
