import {useQueries, useQueryClient} from '@tanstack/react-query';
import {ClientContext, ClientProps} from 'clientContext';
import AvalancheForecastQuery from 'hooks/useAvalancheForecast';
import React from 'react';
import {AvalancheCenter, AvalancheCenterID, MapLayer} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';

export const useMapLayerAvalancheForecasts = (center_id: AvalancheCenterID, requestedTime: RequestedTime, mapLayer: MapLayer, metadata: AvalancheCenter) => {
  const queryClient = useQueryClient();
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const expiryTimeHours = metadata?.config.expires_time;
  const expiryTimeZone = metadata?.timezone;

  return useQueries({
    queries: mapLayer
      ? mapLayer.features.map(feature => {
          return {
            queryKey: AvalancheForecastQuery.queryKey(nationalAvalancheCenterHost, center_id, feature.id, requestedTime, expiryTimeZone, expiryTimeHours),
            queryFn: async () => AvalancheForecastQuery.fetch(queryClient, nationalAvalancheCenterHost, center_id, feature.id, requestedTime, expiryTimeZone, expiryTimeHours),
            enabled: !!expiryTimeHours,
            cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
          };
        })
      : [],
  });
};
