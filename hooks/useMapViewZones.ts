import {useQuery} from 'react-query';
import {format} from 'date-fns';

import {useMapLayer} from './useMapLayer';
import {useAvalancheForecastFragments} from './useAvalancheForecastFragments';

import {AvalancheCenterID, DangerLevel, FeatureComponent} from 'types/nationalAvalancheCenter';

export type MapViewZone = {
  center_id: AvalancheCenterID;
  zone_id?: number;
  name?: string;
  danger_level?: DangerLevel;
  danger?: string;
  start_date: string | null;
  end_date: string | null;
  geometry?: FeatureComponent;
  fillOpacity: number;
};

export const useMapViewZones = (center_id: AvalancheCenterID, date: Date) => {
  const {data: mapLayer} = useMapLayer(center_id);
  const {data: fragments} = useAvalancheForecastFragments(center_id, date);

  // This query executes as soon as `useMapLayer` finishes, but then tries to augment
  // data with anything found in `useAvalancheForecastFragments`.
  return useQuery<MapViewZone[], Error>(
    [center_id, format(date, 'y-MM-dd')],
    () => {
      if (mapLayer.features == null || mapLayer.features.length === 0) {
        throw new Error('Unexpected error: feature array is empty');
      }

      // Build up the base layer of data from the result of useMapLayer
      const featureMap = mapLayer.features.reduce((accum, feature) => {
        accum[feature.id] = {
          zone_id: feature.id,
          center_id,
          geometry: feature.geometry,
          ...feature.properties,
        };
        return accum;
      }, {});

      // Freshen up the data with values from useAvalancheForecastFragments, if available
      if (fragments != null) {
        fragments.forEach(forecast => {
          forecast.forecast_zone?.forEach(({zone_id}) => {
            const mapViewZoneData = featureMap[zone_id];
            if (mapViewZoneData) {
              mapViewZoneData.dangerLevel = forecast.danger?.filter(d => d.valid_day === 'current').map(d => Math.max(d.lower, d.middle, d.upper)) ?? mapViewZoneData.dangerLevel;
              mapViewZoneData.danger = forecast.danger_level_text ?? mapViewZoneData.danger;
              mapViewZoneData.startDate = forecast.published_time ?? mapViewZoneData.startDate;
              mapViewZoneData.endDate = forecast.expires_time ?? mapViewZoneData.endDate;
            }
          });
        });
      }

      return Object.keys(featureMap).map(k => featureMap[k]);
    },
    {
      enabled: !!mapLayer,
    },
  );
};
