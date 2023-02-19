import {Image} from 'react-native';

import {QueryClient} from '@tanstack/react-query';

import Log from 'network/log';

import {preloadAvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {preloadAvalancheProblemIcons} from 'components/AvalancheProblemIcon';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import LatestAvalancheForecastQuery from 'hooks/useLatestAvalancheForecast';
import AvalancheCenterMapLayerQuery from 'hooks/useMapLayer';
import {AvalancheCenter, AvalancheCenterID, MediaType, Product} from 'types/nationalAvalancheCenter';

//
// Note: you can enable preload logging by setting ENABLE_PREFETCH_LOGGING in network/log
//
export const prefetchAllActiveForecasts = async (queryClient: QueryClient, center_id: AvalancheCenterID, prefetchDate: Date, nationalAvalancheCenterHost: string) => {
  preloadAvalancheCenterLogo(center_id);
  await queryClient.prefetchQuery({
    queryKey: ['problem-images'],
    queryFn: async () => preloadAvalancheProblemIcons(),
  });
  await AvalancheCenterMapLayerQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id);
  await AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id);

  const metadata = queryClient.getQueryData<AvalancheCenter>(AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, center_id));
  metadata?.zones
    .filter(zone => zone.status === 'active')
    .forEach(async zone => {
      await LatestAvalancheForecastQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, zone.id, prefetchDate, metadata?.timezone, metadata?.config.expires_time);
      const forecastData = queryClient.getQueryData<Product>(
        LatestAvalancheForecastQuery.queryKey(nationalAvalancheCenterHost, center_id, zone.id, prefetchDate, metadata?.timezone, metadata?.config.expires_time),
      );
      [forecastData.media, forecastData.forecast_avalanche_problems?.map(p => p.media)]
        .flat()
        .filter(item => item != null)
        .filter(item => item.type === MediaType.Image) // TODO: handle prefetching other types of media
        .forEach(async item => {
          await queryClient.prefetchQuery({
            queryKey: ['url', item.url.original],
            queryFn: async () => {
              await Image.prefetch(item.url.original);
              Log.prefetch('prefetched image', item.url.original);
            },
          });
        });
    });

  Log.prefetch('preload complete!');
};
