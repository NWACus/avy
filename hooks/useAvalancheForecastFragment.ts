import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';
import {add, format} from 'date-fns';

import {ClientContext, ClientProps} from '../clientContext';
import {Product} from '../types/nationalAvalancheCenter';

export const useAvalancheForecastFragment = (center_id: string, forecast_zone_id: number, date: Date) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<Product | undefined, AxiosError | Error>(['products', center_id, forecast_zone_id, format(date, 'y-MM-dd')], async () => {
    const {data} = await axios.get<Product[]>(`${clientProps.host}/v2/public/products`, {
      params: {
        avalanche_center_id: center_id,
        date_start: format(date, 'y-MM-dd'),
        date_end: format(add(date, {days: 1}), 'y-MM-dd'),
      },
    });
    return data.find(forecast => forecast.forecast_zone.find(zone => zone.id === forecast_zone_id));
  });
};
