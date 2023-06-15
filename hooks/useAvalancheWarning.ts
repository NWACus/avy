import React from 'react';

import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import {QueryClient, useQuery} from '@tanstack/react-query';
import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, AvalancheWarning, avalancheWarningSchema} from 'types/nationalAvalancheCenter';
import {apiDateString, RequestedTime} from 'utils/date';
import {ZodError} from 'zod';

export const useAvalancheWarning = (center_id: AvalancheCenterID, zone_id: number, requested_time: RequestedTime) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(nationalAvalancheCenterHost, center_id, zone_id, requested_time);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<AvalancheWarning, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<AvalancheWarning> => fetchAvalancheWarning(nationalAvalancheCenterHost, center_id, zone_id, requested_time, thisLogger),
    cacheTime: 12 * 60 * 60 * 1000, // hold on to this cached data for half a day (in milliseconds)
  });
};

function queryKey(nationalAvalancheCenterHost: string, center_id: string, zone_id: number, requestedTime: RequestedTime) {
  let prefix = '';
  let date: Date = null;
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
): Promise<AvalancheWarning> => {
  const url = `${nationalAvalancheCenterHost}/v2/public/product`;
  const params = {
    center_id: center_id,
    type: 'warning',
    zone_id: zone_id,
  };
  if (requested_time !== 'latest') {
    params['published_time'] = apiDateString(requested_time); // the API accepts a _date_ and appends 19:00 to it for a time...
  }
  const thisLogger = logger.child({url: url, params: params, what: 'avalanche warning'});
  const data = await safeFetch(
    () =>
      axios.get(url, {
        params: params,
      }),
    thisLogger,
  );

  const parseResult = avalancheWarningSchema.deepPartial().safeParse(data);
  if (parseResult.success === false) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.Native.captureException(parseResult.error, {
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
      ...parseResult.data,
      zone_id: zone_id,
    };
  }
};

export default {
  queryKey,
  fetch: fetchAvalancheWarning,
  prefetch: prefetchAvalancheWarning,
};
