import {QueryClient} from '@tanstack/react-query';
import {preloadAvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {preloadAvalancheDangerIcons} from 'components/AvalancheDangerIcon';
import {preloadAvalancheProblemIcons} from 'components/AvalancheProblemIcon';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import AvalancheForecastQuery from 'hooks/useAvalancheForecast';
import AvalancheWarningQuery from 'hooks/useAvalancheWarning';
import ImageCache from 'hooks/useCachedImageURI';
import AvalancheCenterMapLayerQuery from 'hooks/useMapLayer';
import NWACWeatherForecastQuery from 'hooks/useNWACWeatherForecast';
import {AvalancheCenter, AvalancheCenterID, MediaType, Product} from 'types/nationalAvalancheCenter';
import {requestedTimeToUTCDate} from 'utils/date';

//
// Note: you can enable preload logging by setting ENABLE_PREFETCH_LOGGING in network/log
//
export const prefetchAllActiveForecasts = async (queryClient: QueryClient, center_id: AvalancheCenterID, nationalAvalancheCenterHost: string, nwacHost: string) => {
  const requestedTime = 'latest';
  const currentDateTime = requestedTimeToUTCDate(requestedTime);
  preloadAvalancheProblemIcons(queryClient);
  preloadAvalancheDangerIcons(queryClient);
  preloadAvalancheCenterLogo(queryClient, center_id);
  AvalancheCenterMapLayerQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id);
  await AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id);

  const metadata = queryClient.getQueryData<AvalancheCenter>(AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, center_id));
  metadata?.zones
    .filter(zone => zone.status === 'active')
    .forEach(async zone => {
      NWACWeatherForecastQuery.prefetch(queryClient, nwacHost, zone.id, currentDateTime);
      AvalancheWarningQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, zone.id, requestedTime);
      await AvalancheForecastQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, zone.id, requestedTime, metadata?.timezone, metadata?.config.expires_time);
      const forecastData = queryClient.getQueryData<Product>(
        AvalancheForecastQuery.queryKey(nationalAvalancheCenterHost, center_id, zone.id, requestedTime, metadata?.timezone, metadata?.config.expires_time),
      );
      [forecastData.media, forecastData.forecast_avalanche_problems?.map(p => p.media)]
        .flat()
        .filter(item => item != null)
        .filter(item => item.type === MediaType.Image) // TODO: handle prefetching other types of media
        .map(item => [item.url.thumbnail, item.url.original])
        .flat()
        .forEach(async url => ImageCache.prefetch(queryClient, url));
    });
};
