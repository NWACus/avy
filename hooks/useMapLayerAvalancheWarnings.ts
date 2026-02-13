import {useQueries, UseQueryOptions} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {ClientContext, ClientProps} from 'clientContext';
import AvalancheWarningQuery from 'hooks/useAvalancheWarning';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React from 'react';
import {AvalancheCenterID, MapLayer, WarningResultWithZone} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';
import {ZodError} from 'zod';

export const useMapLayerAvalancheWarnings = (center_id: AvalancheCenterID, requestedTime: RequestedTime, mapLayer: MapLayer | undefined) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const preferredCenterFeatures = mapLayer?.features.filter(feature => feature.properties.center_id === center_id);

  return useQueries<UseQueryOptions<WarningResultWithZone, AxiosError | ZodError>[]>({
    queries: preferredCenterFeatures
      ? preferredCenterFeatures.map(feature => {
          return {
            queryKey: AvalancheWarningQuery.queryKey(nationalAvalancheCenterHost, center_id, feature.id, requestedTime),
            queryFn: async (): Promise<WarningResultWithZone> => AvalancheWarningQuery.fetch(nationalAvalancheCenterHost, center_id, feature.id, requestedTime, logger),
            cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
          };
        })
      : [],
  });
};
