import React from 'react';
import {Image} from 'react-native';

import {parseISO} from 'date-fns';
import {useQueries} from 'react-query';

import {AvalancheCenterID, MediaItem, MediaType} from 'types/nationalAvalancheCenter';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useAvalancheForecastFragments} from 'hooks/useAvalancheForecastFragments';
import {fetchProduct} from 'hooks/useAvalancheForecast';
import {ClientContext, ClientProps} from '../clientContext';

export const usePrefetchAllActiveForecasts = (center_id: AvalancheCenterID, date: string) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  useAvalancheCenterMetadata(center_id);

  const prefetchDate: Date = parseISO(date);
  const {data: fragments} = useAvalancheForecastFragments(center_id, prefetchDate);

  const forecastResults = useQueries(
    fragments
      ? fragments.map(forecast => {
          return {
            queryKey: ['host', clientProps.nationalAvalancheCenterHost, 'product', forecast.id],
            queryFn: fetchProduct,
            enabled: !!fragments,
          };
        })
      : [],
  );

  return useQueries(
    forecastResults
      ? forecastResults
          .map(result => result.data) // get data from the results
          .filter(data => data) // only operate on results that have succeeded
          .map(forecast => {
            const media: MediaItem[] = [];
            for (const problem of forecast.forecast_avalanche_problems) {
              if (problem.media) {
                media.push(problem.media);
              }
              for (const item of forecast.media) {
                if (item) {
                  media.push(item);
                }
              }
            }

            return media;
          }) // map each forecast to the list of media items in it
          .reduce((accumulator, currentValue) => accumulator.concat(currentValue), []) // MediaItem[][] -> MediaItem[]
          .filter(item => item.type === MediaType.Image) // TODO: handle prefetching other types of media
          .map(item => {
            return {
              queryKey: ['url', item.url.original],
              queryFn: prefetchImage,
              enabled: !!forecastResults,
            };
          }) // map each media item to the fetcher for it
      : [],
  );
};

const prefetchImage = async ({queryKey}) => {
  await Image.prefetch(queryKey[1]);
};
