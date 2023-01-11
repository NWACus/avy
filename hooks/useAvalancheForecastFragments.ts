import React from 'react';

import axios, {AxiosError} from 'axios';
import {QueryClient, useQuery} from 'react-query';
import {add, sub, format} from 'date-fns';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {AvalancheCenterID, Product, productArraySchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheForecastFragments = (center_id: AvalancheCenterID, date: Date) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  return useQuery<Product[] | undefined, AxiosError | ZodError>({
    queryKey: queryKey(center_id, date),
    queryFn: async () => fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date),
  });
};

function queryKey(center_id: string, date: Date) {
  return ['products', center_id, format(date, 'y-MM-dd')];
}

const prefetchAvalancheForecastFragments = async (queryClient: QueryClient, nationalAvalancheCenterHost: string, center_id: string, date: Date) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(center_id, date),
    queryFn: async () => {
      Log.prefetch('starting fragment prefetch');
      const result = await fetchAvalancheForecastFragments(nationalAvalancheCenterHost, center_id, date);
      Log.prefetch('fragment request finished');
      return result;
    },
  });
  Log.prefetch('avalanche fragment data is cached with react-query');
};

const fetchAvalancheForecastFragments = async (nationalAvalancheCenterHost: string, center_id: string, date: Date) => {
  const url = `${nationalAvalancheCenterHost}/v2/public/products`;
  const {data} = await axios.get(url, {
    params: {
      avalanche_center_id: center_id,
      // TODO(brian): remove this hack of adding/subtracting two days, which works around issues converting between local day and UTC day
      date_start: format(sub(date, {days: 2}), 'y-MM-dd'),
      date_end: format(add(date, {days: 2}), 'y-MM-dd'),
    },
  });

  const parseResult = productArraySchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn('unparsable forecast fragments', url, parseResult.error, JSON.stringify(data, null, 2));
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        center_id,
        date: date.toString(),
        url,
      },
    });
    throw parseResult.error;
  } else {
    // TODO(brian): This is assuming that a forecast always exists for the given zone/date range. That's not a good assumption!
    return parseResult.data;
  }
};

export default {
  queryKey,
  fetch: fetchAvalancheForecastFragments,
  prefetch: prefetchAvalancheForecastFragments,
};
