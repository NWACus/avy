import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from 'clientContext';
import {Product, productSchema} from 'types/nationalAvalancheCenter';
import {useAvalancheForecastFragment} from './useAvalancheForecastFragment';
import {ZodError} from 'zod';

export const useAvalancheForecast = (center_id: string, forecast_zone_id: number, date: Date) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  const {data: fragment} = useAvalancheForecastFragment(center_id, forecast_zone_id, date);
  const forecastId = fragment?.id;

  return useQuery<Product, AxiosError | ZodError>(
    ['product', forecastId],
    async () => {
      const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/product/${forecastId}`;
      const {data} = await axios.get(url);

      const parseResult = productSchema.safeParse(data);
      if (parseResult.success === false) {
        console.warn(`unparsable forecast`, url, parseResult.error, JSON.stringify(data, null, 2));
        Sentry.Native.captureException(parseResult.error, {
          tags: {
            zod_error: true,
            center_id,
            forecast_zone_id,
            date: date.toString(),
            url,
          },
        });
        throw parseResult.error;
      } else {
        return parseResult.data;
      }
    },
    {
      enabled: !!forecastId,
    },
  );
};
