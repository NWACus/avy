import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import {ClientContext, ClientProps} from '../clientContext';
import {Product, productSchema} from '../types/nationalAvalancheCenter';
import {useAvalancheForecastFragment} from './useAvalancheForecastFragment';

export const useAvalancheForecast = (center_id: string, forecast_zone_id: number, date: Date) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  const {data: fragment} = useAvalancheForecastFragment(center_id, forecast_zone_id, date);
  const forecastId = fragment?.id;

  return useQuery<Product, AxiosError | Error>(
    ['product', forecastId],
    async () => {
      const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/product/${forecastId}`
      const {data} = await axios.get(url);

      // Fix up data issues before parsing
      // 1) NWAC (and probably others) return strings for avalanche problem size, not numbers
      data.forecast_avalanche_problems?.forEach(problem => {
        if (problem.size.find(s => typeof s === 'string')) {
          // this is pretty noisy
          console.log('converting size string to number', problem.size);
          problem.size = problem.size.map(s => Number(s));
        }
      });

      const parseResult = productSchema.safeParse(data);
      if (!parseResult.success) {
        // @ts-ignore
        console.warn(`unparsable forecast`, url, parseResult.error, JSON.stringify(data, null, 2));
      }
      return productSchema.parse(data);
    },
    {
      enabled: !!forecastId,
    },
  );
};
