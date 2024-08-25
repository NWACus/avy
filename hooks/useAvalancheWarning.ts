import React, {useEffect, useState} from 'react';

import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from '@sentry/react-native';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {add, formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, warningResultSchema, WarningResultWithZone} from 'types/nationalAvalancheCenter';
import {apiDateString, RequestedTime} from 'utils/date';
import {ZodError} from 'zod';

export const useAvalancheWarning = (center_id: AvalancheCenterID, zone_id: number, requested_time: RequestedTime): UseQueryResult<WarningResultWithZone, AxiosError | ZodError> => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id, zone_id, requested_time);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<WarningResultWithZone, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<WarningResultWithZone> => fetchAvalancheWarning(nationalAvalancheCenterHost, center_id, zone_id, requested_time, thisLogger),
    cacheTime: 12 * 60 * 60 * 1000, // hold on to this cached data for half a day (in milliseconds)
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string, zone_id: number, requestedTime: RequestedTime) {
  let prefix: string;
  let date: Date;
  if (requestedTime === 'latest') {
    prefix = 'latest';
    date = new Date();
  } else {
    prefix = 'archived';
    date = requestedTime;
  }
  return [
    `${prefix}-warning`,
    {
      host: nationalAvalancheCenterHost,
      center: center_id,
      zone_id: zone_id,
      requestedTime: apiDateString(date),
    },
  ];
}

const prefetchAvalancheWarning = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: string,
  zone_id: number,
  requested_time: RequestedTime,
  logger: Logger,
) => {
  const key = queryKey(nationalAvalancheCenterHost, center_id, zone_id, requested_time);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchAvalancheWarning(nationalAvalancheCenterHost, center_id, zone_id, requested_time, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

const fetchAvalancheWarning = async (
  nationalAvalancheCenterHost: string,
  center_id: string,
  zone_id: number,
  requested_time: RequestedTime,
  logger: Logger,
): Promise<WarningResultWithZone> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product`;
  const params: Record<string, string> = {
    center_id: center_id,
    type: 'warning',
    zone_id: String(zone_id),
  };
  if (requested_time !== 'latest') {
    params['published_time'] = apiDateString(add(requested_time, {days: 1})); // the API accepts a _date_ and appends 19:00 to it for a time...
  }
  const what = 'avalanche warning';
  const thisLogger = logger.child({url: url, params: params, what: what});
  const data = await safeFetch(
    () =>
      axios.get<AxiosResponse<unknown>>(url, {
        params: params,
      }),
    thisLogger,
    what,
  );

  const parseResult = warningResultSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        center_id,
        zone_id,
        url,
      },
    });
    throw parseResult.error;
  } else {
    return {
      data: parseResult.data,
      zone_id: zone_id,
    };
  }
};

export default {
  queryKey,
  fetch: fetchAvalancheWarning,
  prefetch: prefetchAvalancheWarning,
};
