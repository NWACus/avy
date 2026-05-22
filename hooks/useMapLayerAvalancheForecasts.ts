import {useQueries, useQueryClient, UseQueryOptions} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {ClientContext, ClientProps} from 'clientContext';
import AvalancheForecastQuery from 'hooks/useAvalancheForecast';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React from 'react';
import {AvalancheCenter, AvalancheCenterID, ForecastResult, MapLayer} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';
import {ZodError} from 'zod';

export const useMapLayerAvalancheForecasts = (
  center_id: AvalancheCenterID,
  requestedTime: RequestedTime,
  mapLayer: MapLayer | undefined,
  metadata: AvalancheCenter | undefined,
) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const queryClient = useQueryClient();
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const expiryTimeHours = metadata?.config.expires_time ?? 0;
  const expiryTimeZone = metadata?.timezone ?? '';
  const preferredCenterFeatures = mapLayer?.features.filter(feature => feature.properties.center_id === center_id);

  return useQueries<UseQueryOptions<ForecastResult, AxiosError | ZodError>[]>({
    queries: preferredCenterFeatures
      ? preferredCenterFeatures.map(feature => {
          return {
            queryKey: AvalancheForecastQuery.queryKey(nationalAvalancheCenterHost, center_id, feature.id, requestedTime, expiryTimeZone, expiryTimeHours),
            queryFn: async (): Promise<ForecastResult> =>
              AvalancheForecastQuery.fetch(queryClient, nationalAvalancheCenterHost, center_id, feature.id, requestedTime, expiryTimeZone, expiryTimeHours, logger),
            enabled: !!metadata,
            cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
          };
        })
      : [],
  });
};
