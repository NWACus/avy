import React, {useContext} from 'react';

import {QueryClient, useQuery, useQueryClient} from '@tanstack/react-query';
import {add, areIntervalsOverlapping} from 'date-fns';

import {Logger} from 'browser-bunyan';
import {ClientContext, ClientProps} from 'clientContext';
import AvalancheForecastFragments from 'hooks/useAvalancheForecastFragments';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenterID, Product} from 'types/nationalAvalancheCenter';
import {notFound, NotFound} from 'types/requests';
import {apiDateString} from 'utils/date';

export const useAvalancheForecastFragment = (center_id: AvalancheCenterID, forecast_zone_id: number, date: Date) => {
  const queryClient = useQueryClient();
  const {nationalAvalancheCenterHost} = useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = ['products', center_id, forecast_zone_id, apiDateString(date)];
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<Product | NotFound, Error>({
    queryKey: key,
    queryFn: async (): Promise<Product | NotFound> => fetchAvalancheForecastFragment(queryClient, nationalAvalancheCenterHost, center_id, forecast_zone_id, date, thisLogger),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
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
): Promise<Product | NotFound> => {
  const fragments = await AvalancheForecastFragments.fetchQuery(queryClient, nationalAvalancheCenterHost, center_id, date, logger);
  const fragment = fragments?.find(
    forecast => isBetween(forecast.published_time, forecast.expires_time, date) && forecast.forecast_zone.find(zone => zone.id === forecast_zone_id),
  );
  if (!fragments || !fragment) {
    return notFound('the avalanche forecast');
  }
  return fragment;
};

export default {
  fetch: fetchAvalancheForecastFragment,
};
