import React from 'react';

import axios, {AxiosError} from 'axios';
import {useQuery} from 'react-query';

import * as Sentry from 'sentry-expo';

import {ClientContext, ClientProps} from '../clientContext';
import {AvalancheCenter, avalancheCenterSchema} from '../types/nationalAvalancheCenter';

export const useAvalancheCenterMetadata = (center_id: string) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return useQuery<AvalancheCenter, AxiosError | Error>(['avalanche-center', center_id], async () => {
    const url = `${clientProps.nationalAvalancheCenterHost}/v2/public/avalanche-center/${center_id}`;
    const {data} = await axios.get(url);

    // Fix up data issues before parsing
    // 1) CAIC is returning malformed JSON for zone config - looks over-escaped
    data.zones.forEach(zone => {
      if (typeof zone.config === 'string') {
        // this is pretty noisy
        // console.log('patching over-escaped zone config', zone.config);
        zone.config = JSON.parse(zone.config);
      }
    });

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
    }
    return avalancheCenterSchema.parse(data);
  });
};
