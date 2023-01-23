import {Image} from 'react-native';

import {QueryClient} from 'react-query';

import Log from 'network/log';

import {AvalancheCenterID, MediaType, Product} from 'types/nationalAvalancheCenter';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import ForecastFragmentsQuery from 'hooks/useAvalancheForecastFragments';
import ForecastQuery from 'hooks/useAvalancheForecast';

//
// Note: you can enable preload logging by setting ENABLE_PREFETCH_LOGGING in network/log
//
export const prefetchAllActiveForecasts = async (queryClient: QueryClient, center_id: AvalancheCenterID, prefetchDate: Date, nationalAvalancheCenterHost: string) => {
  await AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id);
  await ForecastFragmentsQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, prefetchDate);

  const fragments = queryClient.getQueryData<Product[] | undefined>(ForecastFragmentsQuery.queryKey(nationalAvalancheCenterHost, center_id, prefetchDate));
  fragments?.forEach(async f => {
    await ForecastQuery.prefetch(queryClient, nationalAvalancheCenterHost, f.id);
    const forecastData = queryClient.getQueryData<Product>(ForecastQuery.queryKey(nationalAvalancheCenterHost, f.id));
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
