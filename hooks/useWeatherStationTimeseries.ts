import React, {useEffect, useState} from 'react';

import * as Sentry from 'sentry-expo';

import {QueryClient, useQuery, UseQueryResult} from '@tanstack/react-query';
import {AxiosError} from 'axios';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import {formatDistanceToNowStrict, sub} from 'date-fns';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {OpenAPI, TimeseriesDataService} from 'types/generated/snowbound';
import {WeatherStationSource, WeatherStationTimeseries, weatherStationTimeseriesSchema} from 'types/nationalAvalancheCenter';
import {RequestedTime, requestedTimeToUTCDate, toSnowboundStringUTC} from 'utils/date';
import {ZodError} from 'zod';

export const useWeatherStationTimeseries = (
  token: string | undefined,
  stations: Record<string, WeatherStationSource>,
  requestedTime: RequestedTime,
  duration: Duration,
): UseQueryResult<WeatherStationTimeseries, AxiosError | ZodError> => {
  const {snowboundHost: host} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(host, stations, requestedTime, duration);
  const {startDate, endDate} = queryInterval(requestedTime, duration);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<WeatherStationTimeseries, AxiosError | ZodError>({
    queryKey: key,
    queryFn: (): Promise<WeatherStationTimeseries> => fetchWeatherStationTimeseries(host, token ?? '', thisLogger, stations, startDate, endDate),
    enabled: !!token,
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

const queryInterval = (requestedTime: RequestedTime, duration: Duration): {startDate: Date; endDate: Date} => {
  const endDate = requestedTimeToUTCDate(requestedTime);
  endDate.setMinutes(0);
  endDate.setSeconds(0);
  const startDate = sub(endDate, duration);
  startDate.setMinutes(0);
  startDate.setSeconds(0);
  return {
    startDate: startDate,
    endDate: endDate,
  };
};

function queryKey(host: string, stations: Record<string, WeatherStationSource>, requestedTime: RequestedTime, duration: Duration) {
  return [
    `weather-station-timeseries`,
    {
      host: host,
      stations: stations,
      requestedTime: requestedTime,
      durationDays: duration,
    },
  ];
}

export const prefetchWeatherStationTimeseries = async (
  queryClient: QueryClient,
  host: string,
  token: string,
  logger: Logger,
  stations: Record<string, WeatherStationSource>,
  requestedTime: RequestedTime,
  duration: Duration,
) => {
  const key = queryKey(host, stations, requestedTime, duration);
  const thisLogger = logger.child({query: key});
  const {startDate, endDate} = queryInterval(requestedTime, duration);
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<WeatherStationTimeseries> => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = fetchWeatherStationTimeseries(host, token, thisLogger, stations, startDate, endDate);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
  });
};

export const fetchWeatherStationTimeseries = async (
  host: string,
  token: string,
  logger: Logger,
  stations: Record<string, WeatherStationSource>,
  startDate: Date,
  endDate: Date,
): Promise<WeatherStationTimeseries> => {
  const url = `${host}/wx/v1/station/data/timeseries/`;
  const what = 'weather station timeseries';
  const thisLogger = logger.child({url: url, what: what});
  OpenAPI.BASE = host;
  const data: unknown = await TimeseriesDataService.getStationDataTimeseriesWxV1StationDataTimeseriesGet({
    stid: Object.keys(stations).join(','),
    source: [...new Set(Object.values(stations))].join(','),
    startDate: toSnowboundStringUTC(startDate),
    endDate: toSnowboundStringUTC(endDate),
    output: 'records',
    token: token,
  });

  const parseResult = weatherStationTimeseriesSchema.safeParse(data);
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
    return parseResult.data;
  }
};

export default {
  queryKey,
  fetch: fetchWeatherStationTimeseries,
  prefetch: prefetchWeatherStationTimeseries,
};
