import {QueryClient} from '@tanstack/react-query';
import {Logger} from 'browser-bunyan';
import {preloadAvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {preloadAvalancheDangerIcons} from 'components/AvalancheDangerIcon';
import {preloadAvalancheProblemIcons} from 'components/AvalancheProblemIcon';
import {sub} from 'date-fns';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import AvalancheForecastQuery from 'hooks/useAvalancheForecast';
import AvalancheWarningQuery from 'hooks/useAvalancheWarning';
import ImageCache from 'hooks/useCachedImageURI';
import AvalancheCenterMapLayerQuery from 'hooks/useMapLayer';
import NACObservationsQuery from 'hooks/useNACObservations';
import NWACObservationsQuery from 'hooks/useNWACObservations';
import NWACWeatherForecastQuery from 'hooks/useNWACWeatherForecast';
import SynopsisQuery from 'hooks/useSynopsis';
import {AvalancheCenter, AvalancheCenterID, MediaType, Product} from 'types/nationalAvalancheCenter';
import {requestedTimeToUTCDate} from 'utils/date';

export const prefetchAllActiveForecasts = async (queryClient: QueryClient, center_id: AvalancheCenterID, nationalAvalancheCenterHost: string, nwacHost: string, logger: Logger) => {
  const requestedTime = 'latest';
  const currentDateTime = requestedTimeToUTCDate(requestedTime);
  void preloadAvalancheProblemIcons(queryClient, logger);
  void preloadAvalancheDangerIcons(queryClient, logger);
  void preloadAvalancheCenterLogo(queryClient, logger, center_id);
  await AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, logger);

  const metadata = queryClient.getQueryData<AvalancheCenter>(AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, center_id));

  if (metadata.widget_config?.danger_map) {
    void AvalancheCenterMapLayerQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, logger);
  }

  const endDate: Date = currentDateTime;
  const startDate = sub(endDate, {weeks: 2});
  if (center_id === 'NWAC') {
    void NWACObservationsQuery.prefetch(queryClient, nwacHost, center_id, startDate, endDate, logger);
  }
  if (metadata.widget_config?.danger_map) {
    void NACObservationsQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, startDate, endDate, logger);
  }

  if (metadata.widget_config?.forecast) {
    metadata?.zones
      .filter(zone => zone.status === 'active')
      .forEach(async zone => {
        void NWACWeatherForecastQuery.prefetch(queryClient, nwacHost, zone.id, currentDateTime, logger);
        void AvalancheWarningQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, zone.id, requestedTime, logger);
        if (metadata.config?.blog) {
          void SynopsisQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, zone.id, requestedTime, logger);
        }
        await AvalancheForecastQuery.prefetch(
          queryClient,
          nationalAvalancheCenterHost,
          center_id,
          zone.id,
          requestedTime,
          metadata?.timezone,
          metadata?.config.expires_time,
          logger,
        );
        const forecastData = queryClient.getQueryData<Product>(
          AvalancheForecastQuery.queryKey(nationalAvalancheCenterHost, center_id, zone.id, requestedTime, metadata?.timezone, metadata?.config.expires_time),
        );
        [forecastData.media, forecastData.forecast_avalanche_problems?.map(p => p.media)]
          .flat()
          .filter(item => item != null)
          .filter(item => item.type === MediaType.Image) // TODO: handle prefetching other types of media
          .filter(item => item.url)
          .map(item => [item.url.thumbnail, item.url.original])
          .flat()
          .forEach(async url => ImageCache.prefetch(queryClient, logger, url));
      });
  }
};
