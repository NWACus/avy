import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';
import {add, sub, format, isAfter, isBefore, parseISO} from 'date-fns';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from '../clientContext';
import {Product, productArraySchema} from '../types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheForecastFragment = (center_id: string, forecast_zone_id: number, date: Date) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<Product | undefined, AxiosError | ZodError>(['products', center_id, forecast_zone_id, format(date, 'y-MM-dd')], async () => {
    const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/products`;
    const {data} = await axios.get(url, {
      params: {
        avalanche_center_id: center_id,
        date_start: format(sub(date, {days: 1}), 'y-MM-dd'),
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
      throw parseResult.error;
    } else {
      return parseResult.data.find(
        forecast => isBetween(forecast.published_time, forecast.expires_time, date) && forecast.forecast_zone.find(zone => zone.id === forecast_zone_id),
      );
    }
  });
};

const isBetween = (start: string, end: string, date: Date): boolean => {
  return isAfter(date, parseISO(start)) && isBefore(date, parseISO(end));
};
