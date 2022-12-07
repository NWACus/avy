import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import {ClientContext, ClientProps} from '../clientContext';
import {MapLayer, mapLayerSchema} from '../types/nationalAvalancheCenter';

export const useMapLayer = (center_id: string) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<MapLayer, AxiosError | Error>(['map-layer', center_id], async () => {
    const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/products/map-layer/${center_id}`;
    const {data} = await axios.get(url);

    const parseResult = mapLayerSchema.safeParse(data);
    if (!parseResult.success) {
      // @ts-ignore
      console.warn('unparsable map layer', url, parseResult.error, JSON.stringify(data, null, 2));
    }
    return mapLayerSchema.parse(data);
  });
};
