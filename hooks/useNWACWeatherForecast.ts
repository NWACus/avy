import React from 'react';

import {QueryClient, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';

import * as Sentry from 'sentry-expo';

import Log from 'network/log';

import {ClientContext, ClientProps} from 'clientContext';
import {reverseLookup} from 'types/nationalAvalancheCenter';
import {nominalNWACWeatherForecastDate, toDateTimeInterfaceATOM} from 'utils/date';
import {z, ZodError} from 'zod';

export const useNWACWeatherForecast = (zone_id: number, requestedTime: Date) => {
  const {nwacHost} = React.useContext<ClientProps>(ClientContext);

  return useQuery<NWACWeatherForecast, AxiosError | ZodError>({
    queryKey: queryKey(nwacHost, zone_id, requestedTime),
    queryFn: () => fetchNWACWeatherForecast(nwacHost, zone_id, requestedTime),
    staleTime: 60 * 60 * 1000, // re-fetch in the background once an hour (in milliseconds)
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
  });
};

function queryKey(nwacHost: string, zone_id: number, requestedTime: Date) {
  return [
    'nwac-weather',
    {
      host: nwacHost,
      zone_id: zone_id,
      requestedTime: nominalNWACWeatherForecastDate(requestedTime),
    },
  ];
}

export const prefetchNWACWeatherForecast = async (queryClient: QueryClient, nwacHost: string, zone_id: number, requestedTime: Date) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(nwacHost, zone_id, requestedTime),
    queryFn: async () => {
      Log.prefetch(`prefetching NWAC weather forecast for zone ${zone_id} on ${requestedTime}`);
      const result = fetchNWACWeatherForecast(nwacHost, zone_id, requestedTime);
      Log.prefetch(`finished prefetching NWAC weather forecast for zone ${zone_id} on ${requestedTime}`);
      return result;
    },
  });
};

export const TimeOfDay = {
  '': '0-notspec',
  Morning: '1-morning',
  'Mid-day': '1a-midday',
  Afternoon: '2-afternoon',
  Evening: '3-evening',
  Night: '4-night',
} as const;
export type TimeOfDay = (typeof TimeOfDay)[keyof typeof TimeOfDay];

export const FormatTimeOfDay = (value: TimeOfDay): string => {
  return reverseLookup(TimeOfDay, value);
};

const nwacWeatherForecastSchema = z.object({
  five_thousand_foot_temperatures: z.array(
    z.object({
      min: z.number(),
      max: z.number(),
    }),
  ),
  forecaster: z.object({
    first_name: z.string(),
    last_name: z.string(),
  }),
  mountain_weather_forecast: z.object({
    id: z.number(),
    creation_date: z.string().transform(s => s.replace(' ', 'T') + '+00:00'), // YYYY-MM-DD HH:MM:SS  ... (UTC)
    publish_date: z.string().transform(s => s.replace(' ', 'T') + '+00:00'), // YYYY-MM-DD HH:MM:SS  ... (UTC)
    day1_date: z.string(), // YYYY-MM-DD
    special_header_notes: z.string(),
    synopsis_day1_day2: z.string(),
    extended_synopsis: z.string(),
    afternoon: z.coerce.boolean(),
  }),
  periods: z.array(z.string()),
  sub_periods: z.array(z.string()),
  precipitation_by_location: z.array(
    z.object({
      name: z.string(),
      order: z.number(),
      precipitation: z.array(
        z.object({
          value: z.string(),
        }),
      ),
    }),
  ),
  snow_levels: z.array(z.object({elevation: z.number()})),
  ridgeline_winds: z.array(
    z.object({
      direction: z.string(),
      speed: z.string(),
    }),
  ),
  weather_forecasts: z.array(
    z.object({
      date: z.string(), // YYYY-MM-DD
      time_of_day: z.nativeEnum(TimeOfDay),
      description: z.string(),
    }),
  ),
});

export type NWACWeatherForecast = z.infer<typeof nwacWeatherForecastSchema>;

const nwacWeatherForecastMetaSchema = z.object({
  meta: z.object({
    limit: z.number().optional().nullable(),
    next: z.string().optional().nullable(),
    offset: z.number().optional().nullable(),
    previous: z.string().optional().nullable(),
    total_count: z.number().optional().nullable(),
  }),
  objects: nwacWeatherForecastSchema,
});

export const fetchNWACWeatherForecast = async (nwacHost: string, zone_id: number, requestedTime: Date): Promise<NWACWeatherForecast> => {
  const url = `${nwacHost}/api/v1/mountain-weather-region-forecast`;
  const {data} = await axios.get(url, {
    params: {
      zone_id: zone_id,
      published_datetime: toDateTimeInterfaceATOM(requestedTime),
    },
  });

  const parseResult = nwacWeatherForecastMetaSchema.safeParse(data);
  if (parseResult.success === false) {
    console.warn(`unparsable weather forecast`, url, parseResult.error, JSON.stringify(data, null, 2));
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    throw parseResult.error;
  } else {
    return parseResult.data.objects;
  }
};

export default {
  queryKey,
  fetch: fetchNWACWeatherForecast,
  prefetch: prefetchNWACWeatherForecast,
};
