import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from 'clientContext';
import {AvalancheCenterID, MapLayer, mapLayerSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useMapLayer = (center_id: AvalancheCenterID) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<MapLayer, AxiosError | ZodError>(
    ['map-layer', center_id],
    async () => {
      const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/products/map-layer/${center_id}`;
      const {data} = await axios.get(url);

      const parseResult = mapLayerSchema.safeParse(data);
      if (parseResult.success === false) {
        console.warn('unparsable map layer', url, parseResult.error, JSON.stringify(data, null, 2));
        Sentry.Native.captureException(parseResult.error, {
          tags: {
            zod_error: true,
            center_id,
          },
        });
        throw parseResult.error;
      } else {
        return parseResult.data;
      }
    },
    {
      enabled: !!center_id,
      staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
      cacheTime: Infinity, // hold on to this cached data forever
    },
  );
};
