import React, {useContext, useEffect, useState} from 'react';

import {QueryClient, useQuery, useQueryClient, UseQueryResult} from '@tanstack/react-query';
import {add, areIntervalsOverlapping, isBefore} from 'date-fns';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import AvalancheForecastFragments from 'hooks/useAvalancheForecastFragments';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, ForecastSummaryFragment, ProductType} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {apiDateString} from 'utils/date';

export const useAvalancheForecastFragment = (center_id: AvalancheCenterID, forecast_zone_id: number, date: Date): UseQueryResult<ForecastSummaryFragment, Error> => {
  const queryClient = useQueryClient();
  const {nationalAvalancheCenterHost} = useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = ['products', center_id, forecast_zone_id, apiDateString(date)];
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  return useQuery<ForecastSummaryFragment, Error>({
    queryKey: key,
    queryFn: async (): Promise<ForecastSummaryFragment> => fetchAvalancheForecastFragment(queryClient, nationalAvalancheCenterHost, center_id, forecast_zone_id, date, thisLogger),
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

export const isBetween = (start: Date, end: Date, currentDate: Date): boolean => {
  const currentDateInterval = {start: currentDate, end: add(currentDate, {days: 1})};
  const testInterval = {start: start, end: end};
  return areIntervalsOverlapping(currentDateInterval, testInterval, {inclusive: true});
};

const fetchAvalancheForecastFragment = async (
  queryClient: QueryClient,
  nationalAvalancheCenterHost: string,
  center_id: AvalancheCenterID,
  forecast_zone_id: number,
  date: Date,
  logger: Logger,
): Promise<ForecastSummaryFragment> => {
  const fragments = await AvalancheForecastFragments.fetchQuery(queryClient, nationalAvalancheCenterHost, center_id, date, logger);
  const forecasts: ForecastSummaryFragment[] = [];
  for (const fragment of fragments) {
    if (fragment.product_type === ProductType.Forecast || fragment.product_type === ProductType.Summary) {
      forecasts.push(fragment);
    }
  }
  // we want to emulate the behavior of the NAC "current forecast" API - namely, we don't need to return a forecast
  // that was actually active at the specified time, if there was none - we just return the most recent one, even if
  // it had already expired
  const forecast = forecasts?.findLast(forecast => isBefore(new Date(forecast.published_time), date) && forecast.forecast_zone.find(zone => zone.id === forecast_zone_id));
  if (!forecasts || !forecast) {
    throw new NotFoundError(`no avalanche forecast found for center ${center_id} and zone ${forecast_zone_id} active on ${date.toISOString()}`, 'avalanche forecast');
  }
  return forecast;
};

export default {
  fetch: fetchAvalancheForecastFragment,
};
