import log from 'logger';
import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {roundToNearestMinutes} from 'date-fns';
import {logQueryKey} from 'hooks/logger';
import {ObservationsQuery} from 'hooks/useObservations';
import {AvalancheCenterID, observationSchema} from 'types/nationalAvalancheCenter';
import {toDateTimeInterfaceATOM} from 'utils/date';
import {z, ZodError} from 'zod';

export const useNWACObservations = (center_id: AvalancheCenterID, published_after: Date, published_before: Date) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);

  return useQuery<ObservationsQuery, AxiosError | ZodError>({
    queryKey: queryKey(nwacHost, center_id, published_after, published_before),
    queryFn: () => fetchNWACObservations(nwacHost, center_id, published_after, published_before),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nwacHost: string, center_id: AvalancheCenterID, published_after: Date, published_before: Date) {
  return logQueryKey([
    'nwac-observations',
    {
      host: nwacHost,
      center_id: center_id,
      published_after: roundDate(published_after),
      published_before: roundDate(published_before),
    },
  ]);
}

// we want to cache our responses, so we need them to align with some less-volatile boundaries
function roundDate(date: Date): Date {
  return roundToNearestMinutes(date, {nearestTo: 15});
}

export const prefetchNWACObservations = async (queryClient: QueryClient, nwacHost: string, center_id: AvalancheCenterID, published_after: Date, published_before: Date) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nwacHost, center_id, published_after, published_before),
    queryFn: async () => {
      Log.prefetch(`prefetching ${center_id} NWAC observations between ${published_after} and ${published_before}`);
      const result = fetchNWACObservations(nwacHost, center_id, published_after, published_before);
      Log.prefetch(`finished prefetching ${center_id} NWAC observations between ${published_after} and ${published_before}`);
      return result;
    },
  });
};

const nwacObservationsSchema = z.object({
  meta: z.object({
    limit: z.number().optional().nullable(),
    next: z.string().optional().nullable(),
    offset: z.number().optional().nullable(),
    previous: z.string().optional().nullable(),
    total_count: z.number().optional().nullable(),
  }),
  objects: z.array(
    z.object({
      id: z.number(),
      post_type: z.string(),
      post_date: z.string(),
      content: observationSchema.deepPartial(),
    }),
  ),
});

export const fetchNWACObservations = async (nwacHost: string, center_id: AvalancheCenterID, published_after: Date, published_before: Date): Promise<ObservationsQuery> => {
  if (center_id !== 'NWAC') {
    return {getObservationList: []};
  }
  const url = `${nwacHost}/api/v2/observations`;
  const params = {
    published_after: toDateTimeInterfaceATOM(roundDate(published_after)),
    published_before: toDateTimeInterfaceATOM(roundDate(published_before)),
  };
  const {data} = await axios.get(url, {
    params: params,
  });

  const parseResult = nwacObservationsSchema.safeParse(data);
  if (parseResult.success === false) {
    log.warn(`unparsable observations`, url, JSON.stringify(params), parseResult.error, JSON.stringify(data));
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    throw parseResult.error;
  } else {
    return {
      getObservationList: parseResult.data.objects.map(object => ({
        id: String(object.id),
        observerType: object.content.observer_type,
        name: object.content.name,
        createdAt: object.content.created_at,
        locationName: object.content.location_name,
        instability: object.content.instability,
        observationSummary: object.content.observation_summary,
        locationPoint: object.content.location_point,
        media: object.content.media,
      })),
    };
  }
};

export default {
  queryKey,
  fetch: fetchNWACObservations,
  prefetch: prefetchNWACObservations,
};
