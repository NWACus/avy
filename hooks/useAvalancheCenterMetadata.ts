import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import {ClientContext, ClientProps} from '../clientContext';
import {AvalancheCenter} from '../types/nationalAvalancheCenter';

export const useAvalancheCenterMetadata = (center_id: string) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<AvalancheCenter, AxiosError | Error>(['avalanche-center', center_id], async () => {
    const {data} = await axios.get<AvalancheCenter>(`${clientProps.host}/v2/public/avalanche-center/${center_id}`);
    return data;
  });
};
