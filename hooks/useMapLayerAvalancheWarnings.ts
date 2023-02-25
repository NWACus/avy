import {useQueries} from '@tanstack/react-query';
import {ClientContext, ClientProps} from 'clientContext';
import AvalancheWarningQuery from 'hooks/useAvalancheWarning';
import React from 'react';
import {AvalancheCenterID, MapLayer} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';

export const useMapLayerAvalancheWarnings = (center_id: AvalancheCenterID, requestedTime: RequestedTime, mapLayer: MapLayer) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);

  return useQueries({
    queries: mapLayer
      ? mapLayer.features.map(feature => {
          return {
            queryKey: AvalancheWarningQuery.queryKey(nationalAvalancheCenterHost, center_id, feature.id, requestedTime),
            queryFn: async () => AvalancheWarningQuery.fetch(nationalAvalancheCenterHost, center_id, feature.id, requestedTime),
            cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
          };
        })
      : [],
  });
};
