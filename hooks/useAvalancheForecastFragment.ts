import {useContext} from 'react';

import {add, areIntervalsOverlapping} from 'date-fns';
import {useQuery, useQueryClient} from 'react-query';

import {ClientContext, ClientProps} from 'clientContext';
import AvalancheForecastFragments from 'hooks/useAvalancheForecastFragments';
import {AvalancheCenterID, Product} from 'types/nationalAvalancheCenter';
import {apiDateString} from 'utils/date';

export const useAvalancheForecastFragment = (center_id: AvalancheCenterID, forecast_zone_id: number, date: Date) => {
  const queryClient = useQueryClient();
  const {nationalAvalancheCenterHost} = useContext<ClientProps>(ClientContext);

  return useQuery<Product, Error>(
    ['products', center_id, forecast_zone_id, apiDateString(date)],
    async () => {
      const fragments = await AvalancheForecastFragments.fetchQuery(queryClient, nationalAvalancheCenterHost, center_id, date);
      return fragments?.find(forecast => isBetween(forecast.published_time, forecast.expires_time, date) && forecast.forecast_zone.find(zone => zone.id === forecast_zone_id));
    },
    {
      staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
      cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    },
  );
};

export const isBetween = (start: Date, end: Date, currentDate: Date): boolean => {
  const currentDateInterval = {start: currentDate, end: add(currentDate, {days: 1})};
  const testInterval = {start: start, end: end};
  return areIntervalsOverlapping(currentDateInterval, testInterval, {inclusive: true});
};
