import {NWACWeatherForecastDay} from 'types/nwacWeather/nwacWeather';
import {z} from 'zod';

const nullableNumber = z.number().nullable();

const grid = <Cell extends z.ZodTypeAny>(cell: Cell) => z.record(z.string(), z.record(z.string(), cell));

const nwacWeatherIssuanceSchema = z.object({
  id: z.number(),
  type: z.enum(['morning', 'afternoon']),
  issuedAt: z.string(),
  serviceDate: z.string(),
  author: z.string().nullable(),
  synopsis: z.string().nullable(),
  extendedOutlook: z.string().nullable(),
  zones: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      avalancheZoneId: nullableNumber,
    }),
  ),
  points: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      zoneId: z.string().nullable(),
      zoneName: z.string(),
      avalancheZoneId: nullableNumber,
    }),
  ),
  periods: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      short: z.string().nullable(),
      kind: z.enum(['day', 'night']),
      date: z.string(),
      precip: z.boolean(),
    }),
  ),
  blocks: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      part: z.string(),
      period: z.string().nullable(),
    }),
  ),
  extendedBlocks: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      part: z.string(),
      date: z.string(),
    }),
  ),
  precip: grid(z.object({qpf: nullableNumber, slr: nullableNumber})),
  temp: grid(z.object({high: nullableNumber, low: nullableNumber})),
  wind: grid(z.object({dir: z.string().nullable(), speed: nullableNumber})),
  snowLevel: grid(z.object({freezing: nullableNumber, mode: z.string().nullable()})),
  extendedSnowLevel: grid(z.object({freezing: nullableNumber, mode: z.string().nullable()})),
  sensible: grid(z.string()),
});

export const nwacWeatherForecastDaySchema: z.ZodType<NWACWeatherForecastDay> = z.object({
  serviceDate: z.string(),
  issuances: z.array(nwacWeatherIssuanceSchema),
});

export const nwacWeatherZoneResponseSchema = z.object({
  day: nwacWeatherForecastDaySchema.nullable(),
});
