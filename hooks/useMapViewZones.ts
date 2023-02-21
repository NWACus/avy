import React from 'react';
import {useQueries, useQuery} from 'react-query';

import LatestAvalancheForecastQuery from 'hooks/useLatestAvalancheForecast';
import {useMapLayer} from 'hooks/useMapLayer';

import {ClientContext, ClientProps} from 'clientContext';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {AvalancheCenterID, DangerLevel, FeatureComponent} from 'types/nationalAvalancheCenter';
import {apiDateString} from 'utils/date';

export type MapViewZone = {
  center_id: AvalancheCenterID;
  zone_id?: number;
  name?: string;
  danger_level?: DangerLevel;
  danger?: string;
  start_date: Date | null;
  end_date: Date | null;
  geometry?: FeatureComponent;
  fillOpacity: number;
  hasWarning: boolean;
};

export const useMapViewZones = (center_id: AvalancheCenterID, date: Date) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {data: mapLayer} = useMapLayer(center_id);
  const {data: metadata} = useAvalancheCenterMetadata(center_id);
  const expiryTimeHours = metadata?.config.expires_time;
  const expiryTimeZone = metadata?.timezone;

  const forecastResults = useQueries(
    mapLayer
      ? mapLayer.features.map(feature => {
          return {
            queryKey: LatestAvalancheForecastQuery.queryKey(nationalAvalancheCenterHost, center_id, feature.id, date, expiryTimeZone, expiryTimeHours),
            queryFn: async () => LatestAvalancheForecastQuery.fetch(nationalAvalancheCenterHost, center_id, feature.id),
            enabled: !!expiryTimeHours,
            cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
          };
        })
      : [],
  );

  // This query executes as soon as `useMapLayer` finishes, but then tries to augment
  // data with anything found in `useAvalancheForecastFragments`.
  return useQuery<MapViewZone[], Error>(
    [center_id, apiDateString(date)],
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
          hasWarning: feature.properties.warning?.product === 'warning',
          ...feature.properties,
        };
        return accum;
      }, {});

      // Freshen up the data with values from useAvalancheForecastFragments, if available
      if (forecastResults != null) {
        forecastResults
          .map(result => result.data) // get data from the results
          .filter(data => data) // only operate on results that have succeeded
          .forEach(forecast => {
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
