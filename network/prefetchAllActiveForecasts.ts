import {QueryClient} from '@tanstack/react-query';
import {Logger} from 'browser-bunyan';
import {preloadAvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {preloadAvalancheDangerIcons} from 'components/AvalancheDangerIcon';
import {preloadAvalancheProblemIcons} from 'components/AvalancheProblemIcon';
import {images} from 'components/content/carousel';
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
import WeatherForecastQuery from 'hooks/useWeatherForecast';
import {AvalancheCenter, AvalancheCenterID, ForecastResult, ImageMediaItem, ProductType} from 'types/nationalAvalancheCenter';
import {requestedTimeToUTCDate} from 'utils/date';

export const prefetchAllActiveForecasts = async (queryClient: QueryClient, center_id: AvalancheCenterID, nationalAvalancheCenterHost: string, nwacHost: string, logger: Logger) => {
  const requestedTime = 'latest';
  const currentDateTime = requestedTimeToUTCDate(requestedTime);
  void preloadAvalancheProblemIcons(queryClient, logger);
  void preloadAvalancheDangerIcons(queryClient, logger);
  void preloadAvalancheCenterLogo(queryClient, logger, center_id);
  await AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, logger);

  const metadata = queryClient.getQueryData<AvalancheCenter>(AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, center_id));

  if (metadata?.widget_config?.danger_map) {
    void AvalancheCenterMapLayerQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, logger);
  }

  const endDate: Date = currentDateTime;
  const startDate = sub(endDate, {weeks: 2});
  if (center_id === 'NWAC') {
    void NWACObservationsQuery.prefetch(queryClient, nwacHost, center_id, startDate, endDate, logger);
  }
  if (metadata?.widget_config?.danger_map) {
    void NACObservationsQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, startDate, endDate, logger);
  }

  if (metadata?.widget_config?.forecast) {
    metadata?.zones
      .filter(zone => zone.status === 'active')
      .forEach(zone => {
        void (async () => {
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
            metadata?.config?.expires_time ?? 0,
            logger,
          );
          const forecastData = queryClient.getQueryData<ForecastResult>(
            AvalancheForecastQuery.queryKey(nationalAvalancheCenterHost, center_id, zone.id, requestedTime, metadata?.timezone, metadata?.config?.expires_time ?? 0),
          );
          if (forecastData) {
            const media: ImageMediaItem[] = images(forecastData.media);
            if (forecastData.product_type === ProductType.Forecast) {
              if (forecastData.weather_data?.weather_product_id) {
                void WeatherForecastQuery.prefetch(queryClient, nationalAvalancheCenterHost, forecastData.weather_data?.weather_product_id, logger);
              }

              for (const problem of forecastData.forecast_avalanche_problems) {
                media.concat(images([problem.media]));
              }
            }

            media
              .map(item => [item.url.thumbnail, item.url.original])
              .flat()
              .forEach(url => {
                if (url) {
                  void (async (url: string) => {
                    await ImageCache.prefetch(queryClient, logger, url);
                  })(url);
                }
              });
          }
        })();
      });
  }
};
