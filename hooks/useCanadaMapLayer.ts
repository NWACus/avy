import React, {useEffect, useState} from 'react';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError, AxiosResponse} from 'axios';

import * as Sentry from '@sentry/react-native';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {CanadaForecastAreas, canadaForecastAreasSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useCanadaMapLayer = (): UseQueryResult<CanadaForecastAreas, AxiosError | ZodError> => {
  const {avalancheCanadaHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(avalancheCanadaHost);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<CanadaForecastAreas, AxiosError | ZodError>({
    queryKey: key,
    queryFn: async (): Promise<CanadaForecastAreas> => fetchCanadaMapLayer(avalancheCanadaHost, thisLogger),
    cacheTime: 24 * 60 * 60 * 1000, // hold this in the query cache for one day after it's become inactive
  });
};

function queryKey(avalancheCanadaHost: string) {
  return ['canada-map-layer', {host: avalancheCanadaHost}];
}

export const prefetchCanadaMapLayer = async (queryClient: QueryClient, avalancheCanadaHost: string, logger: Logger) => {
  const key = queryKey(avalancheCanadaHost);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<CanadaForecastAreas> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchCanadaMapLayer(avalancheCanadaHost, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold this in the query cache for one day after it's become inactive
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

const fetchCanadaMapLayer = async (avalancheCanadaHost: string, logger: Logger): Promise<CanadaForecastAreas> => {
  const url = `${avalancheCanadaHost}/forecasts/en/areas`;
  const what = 'avalanche canada forecast areas';
  const thisLogger = logger.child({url: url, what: what});
  const data = await safeFetch(() => axios.get<AxiosResponse<unknown>>(url), thisLogger, what);

  const parseResult = canadaForecastAreasSchema.safeParse(data);
  if (!parseResult.success) {
    thisLogger.warn({error: parseResult.error}, 'failed to parse');
    Sentry.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    throw parseResult.error;
  }
  return parseResult.data;
};

export default {
  queryKey,
  prefetch: prefetchCanadaMapLayer,
};
