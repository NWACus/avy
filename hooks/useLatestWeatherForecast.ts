import {useLatestWeatherForecasts, WeatherForecast} from 'hooks/useLatestWeatherForecasts';
import {useQuery} from 'react-query';
import {AvalancheCenterID, AvalancheForecastZone} from 'types/nationalAvalancheCenter';

export const useLatestWeatherForecast = (center_id: AvalancheCenterID, zone: AvalancheForecastZone) => {
  if (center_id !== 'NWAC') {
    throw new Error(`can't fetch weather for ${center_id}: useWeatherForecast hook only supports NWAC`);
  }
  const {data: forecasts} = useLatestWeatherForecasts(center_id);

  return useQuery<WeatherForecast, Error>(
    ['products', center_id, zone.id],
    () => {
      const zoneData = forecasts.zones[zone.name];
      if (!zoneData) {
        throw new Error(`can't fetch weather for ${zone.id} (${zone.name}): can't find matching forecast`);
      }
      return {
        author: forecasts.author,
        published_time: forecasts.published_time,
        expires_time: forecasts.expires_time,
        synopsis: forecasts.synopsis,
        data: zoneData,
      };
    },
    {
      enabled: !!forecasts,
      staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
      cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    },
  );
};
