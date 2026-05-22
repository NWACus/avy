import {QueryClient} from '@tanstack/react-query';
import {Logger} from 'browser-bunyan';
import {filterToKnownCenters, filterToSupportedCenters} from 'components/avalancheCenterList';
import {preloadAvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {preloadAvalancheDangerIcons} from 'components/AvalancheDangerIcon';
import {preloadAvalancheProblemIcons} from 'components/AvalancheProblemIcon';
import {images} from 'components/content/carousel/MediaCarousel';
import AllMapLayersQuery from 'hooks/useAllMapLayers';
import AvalancheCenterCapabilitiesQuery from 'hooks/useAvalancheCenterCapabilities';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import AvalancheForecastQuery from 'hooks/useAvalancheForecast';
import AvalancheWarningQuery from 'hooks/useAvalancheWarning';
import ImageCache from 'hooks/useCachedImageURI';
import NACObservationsQuery from 'hooks/useNACObservations';
import NWACObservationsQuery from 'hooks/useNWACObservations';
import NWACWeatherForecastQuery from 'hooks/useNWACWeatherForecast';
import SynopsisQuery from 'hooks/useSynopsis';
import WeatherForecastQuery from 'hooks/useWeatherForecast';
import WeatherStationsQuery from 'hooks/useWeatherStationsMetadata';
import TimeseriesQuery from 'hooks/useWeatherStationTimeseries';
import {
  AllAvalancheCenterCapabilities,
  AvalancheCenter,
  AvalancheCenterID,
  AvalancheForecastZoneStatus,
  ForecastResult,
  ImageMediaItem,
  ProductType,
  WeatherStationCollection,
  WeatherStationSource,
} from 'types/nationalAvalancheCenter';
import {requestedTimeToUTCDate} from 'utils/date';

export const prefetchAllActiveForecasts = async (
  queryClient: QueryClient,
  center_id: AvalancheCenterID,
  nationalAvalancheCenterHost: string,
  nationalAvalancheCenterWordpressHost: string,
  nwacHost: string,
  snowboundHost: string,
  logger: Logger,
) => {
  const requestedTime = 'latest';
  const currentDateTime = requestedTimeToUTCDate(requestedTime);
  void preloadAvalancheProblemIcons(queryClient, logger);
  void preloadAvalancheDangerIcons(queryClient, logger);
  void preloadAvalancheCenterLogo(queryClient, logger, center_id);

  await AvalancheCenterCapabilitiesQuery.prefetch(queryClient, nationalAvalancheCenterWordpressHost, logger);
  const capabilities = queryClient.getQueryData<AllAvalancheCenterCapabilities>(AvalancheCenterCapabilitiesQuery.queryKey(nationalAvalancheCenterWordpressHost));
  const knownCenters: AvalancheCenterID[] = [];

  if (capabilities) {
    knownCenters.push(...filterToSupportedCenters(filterToKnownCenters(capabilities.centers.map(center => center.id))));
  }
  knownCenters.forEach(id => {
    void AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, id, logger);
    void preloadAvalancheCenterLogo(queryClient, logger, id);
  });

  await AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, logger);
  const metadata = queryClient.getQueryData<AvalancheCenter>(AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, center_id));

  if (metadata?.widget_config?.danger_map) {
    void AllMapLayersQuery.prefetch(queryClient, nationalAvalancheCenterHost, logger);
  }

  const endDate: Date = currentDateTime;
  if (center_id === 'NWAC') {
    // NWAC fetches in pages of 50 working backwards from endDate
    // This call will prefetch the 50 most recent
    void NWACObservationsQuery.prefetch(queryClient, nwacHost, center_id, endDate, logger);
  }
  if (metadata?.widget_config?.danger_map) {
    // NAC fetches in 2 week chunks working backwards from endDate
    void NACObservationsQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, endDate, logger);
  }

  if (metadata?.widget_config?.stations?.token) {
    await WeatherStationsQuery.prefetch(queryClient, snowboundHost, center_id, metadata?.widget_config?.stations?.token, logger);
    const weatherStations = queryClient.getQueryData<WeatherStationCollection>(WeatherStationsQuery.queryKey(snowboundHost, center_id));
    const stationIds: Record<string, WeatherStationSource> = weatherStations
      ? Object.fromEntries(new Map(weatherStations?.features.map(s => [s.properties.stid, s.properties.source])))
      : {};
    void TimeseriesQuery.prefetch(queryClient, snowboundHost, metadata?.widget_config?.stations?.token, logger, stationIds, requestedTime, {days: 1});
  }

  if (metadata?.widget_config?.forecast) {
    metadata?.zones
      .filter(zone => zone.status === AvalancheForecastZoneStatus.Active)
      .forEach(zone => {
        void (async () => {
          if (center_id === 'NWAC') {
            void NWACWeatherForecastQuery.prefetch(queryClient, nwacHost, zone.id, currentDateTime, logger);
          }
          void AvalancheWarningQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, zone.id, requestedTime, logger);
          if (process.env.EXPO_PUBLIC_ENABLE_CONDITIONS_BLOG && metadata.config?.blog) {
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
