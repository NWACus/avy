import {useQueries} from '@tanstack/react-query';
import {ClientContext, ClientProps} from 'clientContext';
import AvalancheWarningQuery from 'hooks/useAvalancheWarning';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React from 'react';
import {AvalancheCenterID, AvalancheWarning, MapLayer} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';

export const useMapLayerAvalancheWarnings = (center_id: AvalancheCenterID, requestedTime: RequestedTime, mapLayer: MapLayer) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  return useQueries({
    queries: mapLayer
      ? mapLayer.features.map(feature => {
          return {
            queryKey: AvalancheWarningQuery.queryKey(nationalAvalancheCenterHost, center_id, feature.id, requestedTime),
            queryFn: async (): Promise<AvalancheWarning> => AvalancheWarningQuery.fetch(nationalAvalancheCenterHost, center_id, feature.id, requestedTime, logger),
            cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
          };
        })
      : [],
  });
};
