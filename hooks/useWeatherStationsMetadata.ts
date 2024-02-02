import React, {useEffect, useState} from 'react';

import * as Sentry from '@sentry/react-native';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import {AxiosError} from 'axios';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict} from 'date-fns';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {CurrentDataService, OpenAPI} from 'types/generated/snowbound';
import {AvalancheCenterID, WeatherStationCollection, weatherStationCollectionSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useWeatherStationsMetadata = (center: AvalancheCenterID, token: string | undefined): UseQueryResult<WeatherStationCollection, AxiosError | ZodError> => {
  const {snowboundHost: host} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(host, center);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<WeatherStationCollection, AxiosError | ZodError>({
    queryKey: key,
    queryFn: (): Promise<WeatherStationCollection> => fetchWeatherStationsMetadata(host, token ?? '', thisLogger),
    enabled: !!token,
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(host: string, center: AvalancheCenterID) {
  return ['weather-stations', {host: host, center_id: center}];
}

export const prefetchWeatherStationsMetadata = async (queryClient: QueryClient, host: string, center: AvalancheCenterID, token: string, logger: Logger) => {
  const key = queryKey(host, center);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<WeatherStationCollection> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchWeatherStationsMetadata(host, token, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold this in the query cache for a day
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

export const fetchWeatherStationsMetadata = async (host: string, token: string, logger: Logger): Promise<WeatherStationCollection> => {
  const url = `${host}/wx/v1/station/data/current/`;
  const what = 'weather stations';
  const thisLogger = logger.child({url: url, what: what});
  OpenAPI.BASE = host;
  const data: unknown = await CurrentDataService.getStationDataCurrentWxV1StationDataCurrentGet({
    units: 'default',
    calcDiff: true,
    accept: 'application/vnd.geo+json',
    token: token,
  });

  const parseResult = weatherStationCollectionSchema.safeParse(data);
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
    return parseResult.data;
  }
};

export default {
  queryKey,
  fetch: fetchWeatherStationsMetadata,
  prefetch: prefetchWeatherStationsMetadata,
};
