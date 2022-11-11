import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import {ClientContext, ClientProps} from '../clientContext';
import {MapLayer} from '../types/nationalAvalancheCenter';

export const useMapLayer = (center_id: string) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<MapLayer, AxiosError | Error>(['map-layer', center_id], async () => {
    const {data} = await axios.get<MapLayer>(`${clientProps.nationalAvalancheCenterHost}/v2/public/products/map-layer/${center_id}`);
    return data;
  });
};
