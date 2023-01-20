import {useQuery} from 'react-query';
import {add, areIntervalsOverlapping} from 'date-fns';

import {AvalancheCenterID, Product} from 'types/nationalAvalancheCenter';
import {useAvalancheForecastFragments} from './useAvalancheForecastFragments';
import {apiDateString} from 'utils/date';

export const useAvalancheForecastFragment = (center_id: AvalancheCenterID, forecast_zone_id: number, date: Date) => {
  const {data: fragments} = useAvalancheForecastFragments(center_id, date);

  return useQuery<Product, Error>(
    ['products', center_id, forecast_zone_id, apiDateString(date)],
    async () => {
      return fragments?.find(forecast => isBetween(forecast.published_time, forecast.expires_time, date) && forecast.forecast_zone.find(zone => zone.id === forecast_zone_id));
    },
    {
      enabled: !!fragments,
      staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
      cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    },
  );
};

export const isBetween = (start: Date, end: Date, currentDate: Date): boolean => {
  const currentDateInterval = {start: currentDate, end: add(currentDate, {days: 1})};
  return areIntervalsOverlapping(currentDateInterval, {start, end});
};
