import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from 'clientContext';
import {AvalancheCenter, AvalancheCenterID, avalancheCenterSchema} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheCenterMetadata = (center_id: AvalancheCenterID) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<AvalancheCenter, AxiosError | ZodError>(['avalanche-center', center_id], async () => {
    const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/avalanche-center/${center_id}`;
    const {data} = await axios.get(url);

    const parseResult = avalancheCenterSchema.safeParse(data);
    if (parseResult.success === false) {
      console.warn(`unparsable avalanche center ${center_id}`, url, parseResult.error, JSON.stringify(data, null, 2));
      Sentry.Native.captureException(parseResult.error, {
        tags: {
          zod_error: true,
          center_id,
          url,
        },
      });
      throw parseResult.error;
    } else {
      return parseResult.data;
    }
  });
};
