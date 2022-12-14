import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';
import {add, format} from 'date-fns';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from '../clientContext';
import {Product, productArraySchema} from '../types/nationalAvalancheCenter';

export const useAvalancheForecastFragment = (center_id: string, forecast_zone_id: number, date: Date) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<Product | undefined, AxiosError | Error>(['products', center_id, forecast_zone_id, format(date, 'y-MM-dd')], async () => {
    const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/products`;
    const {data} = await axios.get(url, {
      params: {
        avalanche_center_id: center_id,
        date_start: format(date, 'y-MM-dd'),
        date_end: format(add(date, {days: 1}), 'y-MM-dd'),
      },
    });

    const parseResult = productArraySchema.safeParse(data);
    if (parseResult.success === false) {
      console.warn('unparsable forecast fragment', url, parseResult.error, JSON.stringify(data, null, 2));
      Sentry.Native.captureException(parseResult.error, {
        tags: {
          zod_error: true,
          center_id,
          forecast_zone_id,
          date: date.toString(),
          url,
        },
      });
    }
    const products = productArraySchema.parse(data);
    return products.find(forecast => forecast.forecast_zone.find(zone => zone.id === forecast_zone_id));
  });
};
