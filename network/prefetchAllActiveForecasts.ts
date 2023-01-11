import {Image} from 'react-native';

import {parseISO} from 'date-fns';
import {QueryClient} from 'react-query';

import {AvalancheCenterID, MediaType, Product} from 'types/nationalAvalancheCenter';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import ForecastFragmentsQuery from 'hooks/useAvalancheForecastFragments';
import ForecastQuery from 'hooks/useAvalancheForecast';

export const prefetchAllActiveForecasts = async (queryClient: QueryClient, center_id: AvalancheCenterID, date: string, nationalAvalancheCenterHost: string) => {
  const prefetchDate: Date = parseISO(date);

  await AvalancheCenterMetadataQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id);
  await ForecastFragmentsQuery.prefetch(queryClient, nationalAvalancheCenterHost, center_id, prefetchDate);

  const fragments = queryClient.getQueryData<Product[] | undefined>(ForecastFragmentsQuery.queryKey(center_id, prefetchDate));
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
            console.log('prefetched image', item.url.original);
          },
        });
      });
  });

  console.log('preload complete!');
};
