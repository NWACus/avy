import {useQuery} from 'react-query';
import {format, isAfter, isBefore, parseISO} from 'date-fns';

import {AvalancheCenterID, Product} from 'types/nationalAvalancheCenter';
import {useAvalancheForecastFragments} from './useAvalancheForecastFragments';

export const useAvalancheForecastFragment = (center_id: AvalancheCenterID, forecast_zone_id: number, date: Date) => {
  const {data: fragments} = useAvalancheForecastFragments(center_id, date);

  return useQuery<Product, Error>(
    ['products', center_id, forecast_zone_id, format(date, 'y-MM-dd')],
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

const isBetween = (start: string, end: string, date: Date): boolean => {
  return isAfter(date, parseISO(start)) && isBefore(date, parseISO(end));
};
