import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import {ClientContext, ClientProps} from 'clientContext';
import {StationResponse} from 'types/snowbound';

export const useStations = (token: string, page: number) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<StationResponse, AxiosError | Error>(
    ['time-series', page],
    async () => {
      const {data} = await axios.get<StationResponse>(`${clientProps.snowboundHost}/v1/station`, {
        params: {
          token: token,
          page: page,
          per_page: 50,
        },
      });
      return data;
    },
    {keepPreviousData: true, enabled: !!token},
  );
};
