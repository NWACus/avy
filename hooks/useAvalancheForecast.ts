import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import {ClientContext, ClientProps} from '../clientContext';
import {Product} from '../types/nationalAvalancheCenter';
import {useAvalancheForecastFragment} from './useAvalancheForecastFragment';

export const useAvalancheForecast = (center_id: string, forecast_zone_id: number, date: Date) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  const {data: fragment} = useAvalancheForecastFragment(center_id, forecast_zone_id, date);
  const forecastId = fragment?.id;

  return useQuery<Product, AxiosError | Error>(
    ['product', forecastId],
    async () => {
      const {data} = await axios.get<Product>(`${clientProps.nationalAvalancheCenterHost}/v2/public/product/${forecastId}`);
      return data;
    },
    {
      enabled: !!forecastId,
    },
  );
};
