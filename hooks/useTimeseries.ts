import React from 'react';

import {useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import {ClientContext, ClientProps} from 'clientContext';
import {logQueryKey} from 'hooks/logger';
import {TimeSeriesResponse} from 'types/snowbound';

export const useTimeSeries = (station_id: number, source: string, token: string) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<TimeSeriesResponse, AxiosError | Error>(
    logQueryKey(['time-series', station_id, source]),
    async () => {
      const {data} = await axios.get<TimeSeriesResponse>(`${clientProps.snowboundHost}/v1/station/timeseries`, {
        params: {
          stid: station_id,
          source: source,
          token: token,
        },
      });
      return data;
    },
    {enabled: !!token},
  );
};

// TODO: there's a /wx/v1/station/data/timeseries/?... endpoint with more query params?
// TODO: stid parameter can be a comma-delimited list of identifiers
// TODO: start_date and end_date parameters must be passed - format is YYYYMMDDHHMM
// TODO: react-query probably doesn't have built in support for this, but we should be able to
// TODO: cache these responses ~forever and can chunk larger requests to make use of cached ranges
