import {z} from 'zod';
export const avalancheCenterIDSchema = z.enum([
  'BAC', // Bridgeport: CA
  'BTAC', // Bridger-Teton: ID, WY
  'CBAC', // Crested Butte: CO
  'CNFAIC', // Chugach National Forest: AK
  'COAA', // Central Oregon: OR
  'ESAC', // Eastern Sierra: CA
  'FAC', // Flathead: MT
  'GNFAC', // Gallatin: MT
  'HAC', // Haines: AK
  'HPAC', // Hatcher Pass: AK
  'IPAC', // Idaho Panhandle: ID, MT
  'KPAC', // Kachina: AZ
  'MSAC', // Mount Shasta: CA
  'MWAC', // Mount Washington: NH
  'NWAC', // Northwest: WA, OR
  'PAC', // Payette: ID
  'SAC', // Sierra: CA
  'SNFAC', // Sawtooths: ID
  'TAC', // Taos: NM
  'VAC', // Valdez: AK
  'WAC', // Wallowas: OR
  'WCMAC', // West Central Montana: MT
  'CAIC', // Colorado - Unsupported
  'UAC', // Utah - Unsupported
  'SOAIX', // Southern Oregon - Unsupported
  'EWYAIX', // Eastern Wyoming - Unsupported
  'EARAC', // Eastern Alaska - Unsupported
  'CAC', // Cordova, Alaska - Unsupported
  'CAAC', // Coastal Alaska - Unsupported
]);

export type AvalancheCenterID = z.infer<typeof avalancheCenterIDSchema>;

export const isSupportedCenter = (centerId: AvalancheCenterID): boolean => {
  switch (centerId) {
    case 'BAC':
    case 'BTAC':
    case 'CBAC':
    case 'CNFAIC':
    case 'COAA':
    case 'ESAC':
    case 'FAC':
    case 'GNFAC':
    case 'HAC':
    case 'HPAC':
    case 'IPAC':
    case 'KPAC':
    case 'MSAC':
    case 'MWAC':
    case 'NWAC':
    case 'PAC':
    case 'SAC':
    case 'SNFAC':
    case 'TAC':
    case 'VAC':
    case 'WAC':
    case 'WCMAC':
      return true;
    case 'CAIC':
    case 'UAC':
    case 'SOAIX':
    case 'EWYAIX':
    case 'EARAC':
    case 'CAC':
    case 'CAAC':
      return false;
  }
};

export function userFacingCenterId(input: AvalancheCenterID, capabilities: AllAvalancheCenterCapabilities): string {
  const capability = capabilities.centers.find(center => center.id === input);
  return capability !== undefined ? capability.display_id : input;
}

export const AvalancheCenterWebsites: Record<AvalancheCenterID, string> = {
  ['NWAC']: 'https://nwac.us/',
  ['BAC']: 'https://bridgeportavalanchecenter.org/',
  ['BTAC']: 'https://bridgertetonavalanchecenter.org/',
  ['CBAC']: 'https://cbavalanchecenter.org/',
  ['CNFAIC']: 'https://www.cnfaic.org/',
  ['COAA']: 'https://www.coavalanche.org/',
  ['ESAC']: 'https://www.esavalanche.org/',
  ['FAC']: 'https://www.flatheadavalanche.org/',
  ['HPAC']: 'https://hpavalanche.org/',
  ['HAC']: 'https://alaskasnow.org/haines',
  ['GNFAC']: 'https://www.mtavalanche.com/',
  ['IPAC']: 'https://www.idahopanhandleavalanche.org/',
  ['KPAC']: 'https://kachinapeaks.org/',
  ['MSAC']: 'https://www.shastaavalanche.org/',
  ['MWAC']: 'https://www.mountwashingtonavalanchecenter.org/',
  ['PAC']: 'https://payetteavalanche.org/',
  ['SAC']: 'https://www.sierraavalanchecenter.org/',
  ['SNFAC']: 'https://www.sawtoothavalanche.com/',
  ['TAC']: 'https://taosavalanchecenter.org/',
  ['VAC']: 'https://alaskasnow.org/valdez/',
  ['WAC']: 'https://wallowaavalanchecenter.org/',
  ['WCMAC']: 'https://missoulaavalanche.org/',
  ['CAIC']: '',
  ['UAC']: '',
  ['SOAIX']: '',
  ['EWYAIX']: '',
  ['EARAC']: '',
  ['CAC']: '',
  ['CAAC']: '',
};

export enum DangerLevel {
  GeneralInformation = -1,
  None,
  Low,
  Moderate,
  Considerable,
  High,
  Extreme,
}

export enum ProductType {
  Forecast = 'forecast',
  Warning = 'warning',
  Watch = 'watch',
  Weather = 'weather',
  Synopsis = 'synopsis',
  Summary = 'summary',
  Special = 'special',
}

export enum ProductStatus {
  Published = 'published',
  // TODO(skuznets): more exist, no idea what they are
}

export enum AvalancheProblemType {
  DryLoose = 1,
  StormSlab,
  WindSlab,
  PersistentSlab,
  DeepPersistentSlab,
  WetLoose,
  WetSlab,
  CorniceFall,
  Glide,
}

export enum AvalancheProblemName {
  DryLoose = 'Dry Loose',
  StormSlab = 'Storm Slab',
  WindSlab = 'Wind Slab',
  PersistentSlab = 'Persistent Slab',
  DeepPersistentSlab = 'Deep Persistent Slab',
  WetLoose = 'Wet Loose',
  WetSlab = 'Wet Slab',
  CorniceFall = 'Cornice Fall',
  Glide = 'Glide',
  GlideAvalanches = 'Glide Avalanches',
}

export enum AvalancheProblemLikelihood {
  Unlikely = 'unlikely',
  Possible = 'possible',
  Likely = 'likely',
  VeryLikely = 'very likely',
  AlmostCertain = 'almost certain',
  Certain = 'certain',
}

export enum AvalancheProblemLocation {
  NorthUpper = 'north upper',
  NortheastUpper = 'northeast upper',
  EastUpper = 'east upper',
  SoutheastUpper = 'southeast upper',
  SouthUpper = 'south upper',
  SouthwestUpper = 'southwest upper',
  WestUpper = 'west upper',
  NorthwestUpper = 'northwest upper',
  NorthMiddle = 'north middle',
  NortheastMiddle = 'northeast middle',
  EastMiddle = 'east middle',
  SoutheastMiddle = 'southeast middle',
  SouthMiddle = 'south middle',
  SouthwestMiddle = 'southwest middle',
  WestMiddle = 'west middle',
  NorthwestMiddle = 'northwest middle',
  NorthLower = 'north lower',
  NortheastLower = 'northeast lower',
  EastLower = 'east lower',
  SoutheastLower = 'southeast lower',
  SouthLower = 'south lower',
  SouthwestLower = 'southwest lower',
  WestLower = 'west lower',
  NorthwestLower = 'northwest lower',
}

export enum AvalancheProblemSize {
  Small = 1,
  Large,
  VeryLarge,
  Historic,
}

// Round the number up, then clamp it to the bounds 1-4
export const numberToProblemSize = (size: number): AvalancheProblemSize => Math.max(AvalancheProblemSize.Small, Math.min(AvalancheProblemSize.Historic, Math.round(size)));

export enum ForecastPeriod {
  Current = 'current',
  Tomorrow = 'tomorrow',
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
  External = 'external',
  Photo = 'photo',
  PDF = 'pdf',
  Unknown = 'unknown',
  None = '',
}

export enum ExternalMediaType {
  Image = 'image',
  Video = 'video',
  Instagram = 'instagram',
}

export enum MediaUsage {
  Anonymous = 'anonymous', // can be re-used, but keep author anonymous
  Credit = 'credit', // can be re-used, but give credit
  Private = 'private', // do not re-use, for forecasters only
}

export enum AvalancheCenterType {
  Nonprofit = 'nonprofit',
  State = 'state',
  USFS = 'usfs',
  Volunteer = 'volunteer',
}

export enum Units {
  English = 'english',
  Metric = 'metric',
  // TODO: what else?
}

export enum AvalancheForecastZoneStatus {
  Active = 'active',
  Disabled = 'disabled',
}

export const dangerLevelSchema = z.nativeEnum(DangerLevel);

export const avalancheProblemLocationSchema = z.nativeEnum(AvalancheProblemLocation);

// Fix up data issues before parsing
// 1) NWAC (and probably others) return strings for avalanche problem size, not numbers
export const avalancheProblemSizeSchema = z
  .number()
  .or(z.string())
  .transform((val: number | string, ctx) => {
    const parsed = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Avalanche problem size must be numeric, got: ${val}.`,
      });
      return z.NEVER;
    }
    return parsed;
  });

export const forecastPeriodSchema = z.nativeEnum(ForecastPeriod);

export const mediaTypeSchema = z.nativeEnum(MediaType);

export const mediaLinksSchema = z
  .object({
    large: z.string().optional(),
    medium: z.string().optional(),
    original: z.string().optional(),
    thumbnail: z.string().optional(),
  })
  .or(z.string().transform((_: string) => ({}))); // when this field is not populated, it's an empty string, not a null

export const avalancheCenterMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  city: z.string().nullable(),
  state: z.string(),
});

export const avalancheForecastZoneSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  state: z.string(),
  zone_id: z.string(),
});
export type AvalancheForecastZoneSummary = z.infer<typeof avalancheForecastZoneSummarySchema>;

export const avalancheCenterTypeSchema = z.nativeEnum(AvalancheCenterType);

export const latLngSchema = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const avalancheCenterForecastWidgetTabSchema = z.object({
  name: z.string(),
  id: z.string(),
  url: z.string(),
});

export const avalancheCenterDangerMapWidgetConfigurationSchema = z.object({
  height: z.union([z.string(), z.number()]),
  saturation: z.union([z.string(), z.number()]),
  search: z.boolean(),
  geolocate: z.boolean(),
  advice: z.boolean(),
  center: latLngSchema,
  zoom: z.number(),
});

export const avalancheCenterObservationViewerWidgetConfigurationSchema = z.object({
  alternate_zones: z.string().nullable(),
  color: z.string(),
  obs_form_url: z.string().nullable().optional(),
  obs_tab: z.boolean().optional(),
  obs_view_url: z.string().nullable().optional(),
  saturation: z.number(),
  require_approval: z.boolean().optional(),
});

export const unitsSchema = z.nativeEnum(Units);

export const externalModalLinkSchema = z.object({
  link_name: z.string().optional(),
  area_plots: z.string().optional(),
  area_tables: z.string().optional(),
});

export const avalancheForecastZoneStatusSchema = z.nativeEnum(AvalancheForecastZoneStatus);

export const elevationBandNamesSchema = z.object({
  lower: z.string(),
  middle: z.string(),
  upper: z.string(),
});
export type ElevationBandNames = z.infer<typeof elevationBandNamesSchema>;

export const nationalWeatherServiceZoneSchema = z.object({
  id: z.number(),
  zone_name: z.string(),
  zone_id: z.string(),
  state: z.string(),
  city: z.string(),
  contact: z.string().nullable(),
  zone_state: z.string(),
});

export const avalancheDangerForecastSchema = z.object({
  lower: dangerLevelSchema.nullable().transform(v => v ?? DangerLevel.None),
  middle: dangerLevelSchema.nullable().transform(v => v ?? DangerLevel.None),
  upper: dangerLevelSchema.nullable().transform(v => v ?? DangerLevel.None),
  valid_day: forecastPeriodSchema,
});
export type AvalancheDangerForecast = z.infer<typeof avalancheDangerForecastSchema>;

export const nullMediaSchema = z.object({
  type: z.null(),
  url: z.null(),
  caption: z.literal(''),
  title: z.literal(''),
});

export const emptyMediaSchema = z.object({
  type: z.literal(''),
  url: z.literal(''),
  caption: z.literal(''),
});
export const imageMediaSchema = z.object({
  id: z.number().or(z.string()).optional(),
  type: z.literal(MediaType.Image),
  url: z.object({
    large: z.string(),
    medium: z.string(),
    original: z.string(),
    thumbnail: z.string(),
  }),
  title: z.string().nullable().optional(),
  caption: z.string().nullable(),
});
export type ImageMediaItem = z.infer<typeof imageMediaSchema>;

export const photoMediaSchema = imageMediaSchema.extend({
  type: z.literal(MediaType.Photo),
  url: z.string(),
});
export type PhotoMediaItem = z.infer<typeof photoMediaSchema>;

export const videoMediaSchema = imageMediaSchema.extend({
  type: z.literal(MediaType.Video),
  url: z
    .object({
      external_link: z.string(),
      external_type: z.nativeEnum(ExternalMediaType),
    })
    .or(
      z.object({
        large: z.string(),
        medium: z.string(),
        original: z.string(),
        thumbnail: z.string(),
        video_id: z.string(),
      }),
    )
    .or(z.string()),
});
export type VideoMediaItem = z.infer<typeof videoMediaSchema>;

export const externalMediaSchema = imageMediaSchema.extend({
  type: z.literal(MediaType.External),
  url: z.object({
    external_link: z.string(),
    external_type: z.nativeEnum(ExternalMediaType),
  }),
});
export type ExternalMediaItem = z.infer<typeof externalMediaSchema>;

export const pdfMediaSchema = z.object({
  type: z.literal(MediaType.PDF),
  url: z.object({
    original: z.string().url(),
  }),
});

const unknownMediaSchema = z.object({
  type: z.literal(MediaType.Unknown),
});

export const mediaItemSchema = z
  .discriminatedUnion('type', [emptyMediaSchema, nullMediaSchema, imageMediaSchema, videoMediaSchema, externalMediaSchema, photoMediaSchema, pdfMediaSchema, unknownMediaSchema])
  .catch({
    type: MediaType.Unknown,
  });
export type MediaItem = z.infer<typeof mediaItemSchema>;

export const avalancheCenterWeatherConfigurationSchema = z.object({
  zone_id: z.string(),
  forecast_point: latLngSchema,
  forecast_url: z.string().nullable(),
});

export const avalancheCenterForecastWidgetConfigurationSchema = z.object({
  color: z.string(),
  elevInfoUrl: z.string(),
  glossary: z.boolean(),
  tabs: z.array(avalancheCenterForecastWidgetTabSchema),
});

export const avalancheCenterStationsWidgetConfigurationSchema = z.object({
  center: latLngSchema.optional(),
  zoom: z.number().optional(),
  center_id: z.string().optional(),
  alternate_zones: z.any().optional(),
  units: unitsSchema.optional(),
  timezone: z.string().optional(),
  color_rules: z.boolean().optional(),
  source_legend: z.boolean().optional(),
  sources: z.array(z.string()).optional(),
  within: z.union([z.string(), z.number()]).optional(),
  external_modal_links: z.union([z.record(externalModalLinkSchema), z.array(externalModalLinkSchema)]).optional(),
  token: z.string().optional(),
});

export const avalancheForecastZoneConfigurationSchema = z.object({
  elevation_band_names: elevationBandNamesSchema,
});

export const avalancheProblemSchema = z.object({
  id: z.number(),
  forecast_id: z.number(),
  rank: z.number(),
  avalanche_problem_id: z.nativeEnum(AvalancheProblemType),
  name: z.nativeEnum(AvalancheProblemName),
  likelihood: z.nativeEnum(AvalancheProblemLikelihood),
  location: z.array(avalancheProblemLocationSchema),
  size: z.array(avalancheProblemSizeSchema),
  discussion: z.string().nullable(),
  problem_description: z.string(),
  icon: z.string(),
  media: mediaItemSchema,
});
export type AvalancheProblem = z.infer<typeof avalancheProblemSchema>;

export const avalancheCenterConfigurationSchema = z.object({
  // expires_time and published_time seem to be fractional hours past midnight, in the locale
  expires_time: z
    .number()
    .nullable()
    .transform(n => n ?? 0),
  published_time: z
    .number()
    .nullable()
    .transform(n => n ?? 0),
  blog: z.boolean(),
  blog_title: z.string(),
  weather_table: z.array(avalancheCenterWeatherConfigurationSchema),
  zone_order: z.array(z.number()).optional(),
});

// the widget configurations are present if and when each forecast center opts into specific NAC functionality
export const avalancheCenterWidgetConfigurationSchema = z.object({
  forecast: avalancheCenterForecastWidgetConfigurationSchema.optional(),
  danger_map: avalancheCenterDangerMapWidgetConfigurationSchema.optional(),
  observation_viewer: avalancheCenterObservationViewerWidgetConfigurationSchema.optional(),
  stations: avalancheCenterStationsWidgetConfigurationSchema.optional(),
});

export const avalancheForecastZoneSchema = z.discriminatedUnion('status', [
  z.object({
    id: z.number(),
    name: z.string(),
    url: z.string(),
    zone_id: z.string(),
    config: avalancheForecastZoneConfigurationSchema,
    status: z.literal(AvalancheForecastZoneStatus.Active),
    rank: z.number().nullable(),
  }),
  z.object({
    id: z.number(),
    name: z.string(),
    zone_id: z.string(),
    status: z.literal(AvalancheForecastZoneStatus.Disabled),
  }),
]);
export type AvalancheForecastZone = z.infer<typeof avalancheForecastZoneSchema>;

export const forecastSchema = z.object({
  id: z.number(),
  product_type: z.literal(ProductType.Forecast),
  status: z.nativeEnum(ProductStatus),
  author: z.string().nullable(),
  published_time: z.string(),
  expires_time: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  announcement: z.string().optional().nullable(),
  bottom_line: z.string().nullable(),
  forecast_avalanche_problems: z.array(avalancheProblemSchema),
  hazard_discussion: z.string().nullable(),
  danger: z.array(avalancheDangerForecastSchema),
  danger_level_text: z.string().optional().nullable(),
  weather_discussion: z.string().optional().nullable(),
  weather_data: z
    .object({
      weather_product_id: z.number(),
    })
    .nullable(),
  media: z.array(mediaItemSchema).nullable(),
  avalanche_center: avalancheCenterMetadataSchema,
  forecast_zone: z.array(avalancheForecastZoneSummarySchema),
});
export type Forecast = z.infer<typeof forecastSchema>;

export const summarySchema = forecastSchema
  .omit({
    danger: true,
    forecast_avalanche_problems: true,
  })
  .extend({
    product_type: z.literal(ProductType.Summary),
    expires_time: z.string().nullable(),
  });
export type Summary = z.infer<typeof summarySchema>;

export const forecastResultSchema = z.discriminatedUnion('product_type', [forecastSchema, summarySchema]);
export type ForecastResult = z.infer<typeof forecastResultSchema>;

export const synopsisSchema = summarySchema.extend({
  product_type: z.literal(ProductType.Synopsis),
});
export type Synopsis = z.infer<typeof synopsisSchema>;

export const weatherPeriodLabelSchema = z.object({
  colspan: z.number().optional(),
  heading: z.string(),
  subheading: z.string().optional(),
  width: z.number(),
});
export type WeatherPeriodLabel = z.infer<typeof weatherPeriodLabelSchema>;

export const weatherDataLabelSchema = z.object({
  field: z.string().nullable(),
  heading: z.string(),
  help: z.string().nullable().optional(), // inline HTML here
  options: z.array(z.string()).nullable(),
  unit: z.string().nullable(),
  style: z.string().nullable().optional(),
});
export type WeatherDataLabel = z.infer<typeof weatherDataLabelSchema>;

export const weatherDatumSchema = z.object({
  colspan: z.string().or(z.number()).optional(),
  prefix: z.string().optional(),
  value: z.string().nullable(),
});
export type WeatherDatum = z.infer<typeof weatherDatumSchema>;

// ex https://www.sawtoothavalanche.com/forecasts/#/forecast/1/124130/weather
export const rowColumnWeatherDataSchema = z.object({
  zone_id: z.string(),
  zone_name: z.string(),
  columns: z.array(z.array(weatherPeriodLabelSchema)).optional(),
  rows: z.array(weatherDataLabelSchema).optional(),
  data: z.array(z.array(weatherDatumSchema)).optional(),
});
export type RowColumnWeatherData = z.infer<typeof rowColumnWeatherDataSchema>;

// ex https://www.sawtoothavalanche.com/forecasts/#/forecast/2/89580
export const inlineWeatherDataSchema = z.object({
  zone_id: z.string(),
  zone_name: z.string(),
  periods: z.array(z.string()), // inline HTML in these
  data: z.array(
    z.object({
      field: z.string(),
      unit: z.string(),
      values: z.array(
        z.string().or(
          z.array(
            z.object({
              label: z.string(),
              value: z.string(),
            }),
          ),
        ),
      ),
    }),
  ),
});
export type InlineWeatherData = z.infer<typeof inlineWeatherDataSchema>;

export const weatherSchema = forecastSchema
  .omit({
    bottom_line: true,
    expires_time: true,
    hazard_discussion: true,
    media: true,
    danger: true,
    forecast_avalanche_problems: true,
  })
  .extend({
    product_type: z.literal(ProductType.Weather),
    weather_data: z.array(rowColumnWeatherDataSchema.or(inlineWeatherDataSchema)),
    weather_discussion: z.string().optional().nullable(),
  });
export type Weather = z.infer<typeof weatherSchema>;

export const nullWarningSchema = z.object({
  avalanche_center: z.null(),
  published_time: z.null(),
  expires_time: z.null(),
  created_at: z.null(),
  updated_at: z.null(),
});
export type NullWarning = z.infer<typeof nullWarningSchema>;

export const warningSchema = z.object({
  id: z.number(),
  product_type: z.literal(ProductType.Warning),
  published_time: z.string(),
  expires_time: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  reason: z.string(),
  affected_area: z.string(),
  bottom_line: z.string(),
  hazard_discussion: z.string(),
  avalanche_center: avalancheCenterMetadataSchema,
});
export type Warning = z.infer<typeof warningSchema>;

export const watchSchema = warningSchema.extend({
  product_type: z.literal(ProductType.Watch),
});
export type Watch = z.infer<typeof watchSchema>;

export const specialSchema = warningSchema.extend({
  product_type: z.literal(ProductType.Special),
});
export type Special = z.infer<typeof specialSchema>;

export const warningResultSchema = nullWarningSchema.or(z.discriminatedUnion('product_type', [warningSchema, watchSchema, specialSchema]));
export type WarningResult = z.infer<typeof warningResultSchema>;

export const warningResultWithZoneSchema = z.object({
  data: nullWarningSchema.or(z.discriminatedUnion('product_type', [warningSchema, watchSchema, specialSchema])),
  zone_id: z.number(),
});
export type WarningResultWithZone = z.infer<typeof warningResultWithZoneSchema>;

export const productSchema = z.discriminatedUnion('product_type', [forecastSchema, summarySchema, synopsisSchema, warningSchema, watchSchema, weatherSchema, specialSchema]);
export type Product = z.infer<typeof productSchema>;

export const forecastFragmentSchema = forecastSchema
  .omit({
    announcement: true,
    forecast_avalanche_problems: true,
    hazard_discussion: true,
    weather_discussion: true,
    weather_data: true,
    media: true,
  })
  .extend({
    avalanche_center: z.object({
      name: z.string(),
    }),
    forecast_zone: z.array(avalancheForecastZoneSummarySchema.omit({state: true})),
  });
export type ForecastFragment = z.infer<typeof forecastFragmentSchema>;

export const summaryFragmentSchema = summarySchema
  .omit({
    announcement: true,
    hazard_discussion: true,
    weather_discussion: true,
    weather_data: true,
    media: true,
  })
  .extend({
    avalanche_center: z.object({
      name: z.string(),
    }),
    forecast_zone: z.array(avalancheForecastZoneSummarySchema.omit({state: true})),
  });
export type SummaryFragment = z.infer<typeof summaryFragmentSchema>;

const _forecastOrSummaryFragmentSchema = z.discriminatedUnion('product_type', [forecastFragmentSchema, summaryFragmentSchema]);
export type ForecastSummaryFragment = z.infer<typeof _forecastOrSummaryFragmentSchema>;

export const synopsisFragmentSchema = synopsisSchema
  .omit({
    announcement: true,
    hazard_discussion: true,
    weather_discussion: true,
    weather_data: true,
    media: true,
  })
  .extend({
    avalanche_center: z.object({
      name: z.string(),
    }),
    forecast_zone: z.array(avalancheForecastZoneSummarySchema.omit({state: true})),
  });
export type SynopsisFragment = z.infer<typeof synopsisFragmentSchema>;

export const weatherFragmentSchema = weatherSchema
  .omit({
    announcement: true,
    weather_discussion: true,
    weather_data: true,
  })
  .extend({
    avalanche_center: z.object({
      name: z.string(),
    }),
    forecast_zone: z.array(avalancheForecastZoneSummarySchema.omit({state: true})),
  });
export type WeatherFragment = z.infer<typeof weatherFragmentSchema>;

export const productFragmentSchema = z.discriminatedUnion('product_type', [forecastFragmentSchema, summaryFragmentSchema, synopsisFragmentSchema, weatherFragmentSchema]);
export type ProductFragment = z.infer<typeof productFragmentSchema>;

export const productFragmentArraySchema = z.array(productFragmentSchema);
export type ProductFragmentArray = z.infer<typeof productFragmentArraySchema>;

export const avalancheCenterSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  city: z.string().nullable(),
  state: z.string(),
  timezone: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  center_point: z.null(),
  created_at: z.string(),
  wkb_geometry: z.null(),
  config: avalancheCenterConfigurationSchema,
  type: avalancheCenterTypeSchema,
  widget_config: avalancheCenterWidgetConfigurationSchema,
  zones: z.array(avalancheForecastZoneSchema),
  nws_zones: z.array(nationalWeatherServiceZoneSchema),
  nws_offices: z.array(z.string()),
  off_season: z.boolean(),
});
export type AvalancheCenter = z.infer<typeof avalancheCenterSchema>;

// FeatureProperties contains three types of metadata about the forecast zone:
// - static information like the name of the zone and timezone
// - dynamic information like the current forecast and travel advice
// - consumer directions for how to render the feature, like fill color & stroke
export const mapLayerPropertiesSchema = z.object({
  name: z.string(),
  center_id: avalancheCenterIDSchema,
  center_link: z.string(),
  state: z.string(),
  link: z.string(),
  off_season: z.boolean(),
  travel_advice: z.string(),
  danger: z.string(),
  danger_level: dangerLevelSchema,
  // start_date and end_date are RFC3339 timestamps that bound the current forecast; they're null when no forecast is currently valid
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  warning: z.object({
    product: z.string().nullable(),
  }),
  color: z.string(),
  stroke: z.string(),
  font_color: z.string(),
  fillOpacity: z.number(),
  fillIncrement: z.number(),
});

const Unknown = 'Unknown';

export function reverseLookup<T extends PropertyKey, U extends PropertyKey>(mapping: Record<T, U>, lookup: U): string {
  return Object.entries(mapping)
    .filter(([_, value]) => value === lookup)
    .map(([key, _]) => key)
    .reduce((accumulator, currentValue) => currentValue, Unknown);
}

export const Activity = {
  'Skiing/Snowboarding': 'skiing_snowboarding',
  'Snowmobiling/Snowbiking': 'snowmobiling_snowbiking',
  'XC Skiing/Snowshoeing': 'xcskiing_snowshoeing',
  Climbing: 'climbing',
  'Walking/Hiking': 'walking',
  'Flying/Heli': 'flying',
  Driving: 'driving',
  Other: 'other',
} as const;
export type Activity = (typeof Activity)[keyof typeof Activity];
export const FormatActivity = (value: Activity): string => {
  return reverseLookup(Activity, value);
};
export const DangerTrend = {
  Increasing: 'increasing',
  Steady: 'steady',
  Decreasing: 'decreasing',
} as const;
export type DangerTrend = (typeof DangerTrend)[keyof typeof DangerTrend];
export const FormatDangerTrend = (value: DangerTrend): string => {
  return reverseLookup(DangerTrend, value);
};
export const DangerConfidence = {
  High: 'high',
  Moderate: 'moderate',
  Low: 'low',
} as const;
export type DangerConfidence = (typeof DangerConfidence)[keyof typeof DangerConfidence];
export const FormatDangerConfidence = (value: DangerConfidence): string => {
  return reverseLookup(DangerConfidence, value);
};
export const InstabilityDistribution = {
  Isolated: 'isolated',
  Specific: 'specific',
  Widespread: 'widespread',
  Low: 'low',
} as const;
export type InstabilityDistribution = (typeof InstabilityDistribution)[keyof typeof InstabilityDistribution];
export const FormatInstabilityDistribution = (value: InstabilityDistribution): string => {
  return reverseLookup(InstabilityDistribution, value);
};
export const CloudCover = {
  Clear: 'clear',
  Few: 'few',
  Scattered: 'scattered',
  Broken: 'broken',
  Overcast: 'overcast',
  Obscured: 'obscured',
} as const;
export type CloudCover = (typeof CloudCover)[keyof typeof CloudCover];
export const FormatCloudCover = (value: CloudCover): string => {
  return reverseLookup(CloudCover, value);
};
export const SnowAvailableForTransport = {
  None: 'none',
  'Small Amounts': 'small smounts',
  'Moderate Amounts': 'moderate amounts',
  'Large Amounts': 'large amounts',
} as const;
export type SnowAvailableForTransport = (typeof SnowAvailableForTransport)[keyof typeof SnowAvailableForTransport];
export const FormatSnowAvailableForTransport = (value: SnowAvailableForTransport): string => {
  return reverseLookup(SnowAvailableForTransport, value);
};
export const WindLoading = {
  None: 'none',
  Light: 'light',
  Moderate: 'moderate',
  Intense: 'intense',
  Previous: 'previous',
  Unknown: 'unknown',
} as const;
export type WindLoading = (typeof WindLoading)[keyof typeof WindLoading];
export const FormatWindLoading = (value: WindLoading): string => {
  return reverseLookup(WindLoading, value);
};
export const AvalancheAspect = {
  N: 'N',
  NE: 'NE',
  E: 'E',
  SE: 'SE',
  S: 'S',
  SW: 'SW',
  W: 'W',
  NW: 'NW',
} as const;
export type AvalancheAspect = (typeof AvalancheAspect)[keyof typeof AvalancheAspect];
export const FormatAvalancheAspect = (value: AvalancheAspect): string => {
  return reverseLookup(AvalancheAspect, value);
};
export const AvalancheType = {
  'SS-Soft Slab': 'SS',
  'HS-Hard Slab': 'HS',
  'L-Dry Loose': 'L',
  'WL-Wet Loose': 'WL',
  'WS-Wet Slab': 'WS',
  'C-Cornice': 'C',
  'R-Roof': 'R',
  'SF-Slush Flow': 'SF',
  'I-Ice Fall': 'I',
  'U-Unknown': 'U',
} as const;
export type AvalancheType = (typeof AvalancheType)[keyof typeof AvalancheType];
export const FormatAvalancheType = (value: AvalancheType): string => {
  return reverseLookup(AvalancheType, value);
};
export const AvalancheBedSurface = {
  'S-New Snow': 'S',
  'I-New/Old Interface': 'I',
  'O-Old Snow': 'O',
  'G-Ground': 'G',
  'U-Unknown': 'U',
} as const;
export type AvalancheBedSurface = (typeof AvalancheBedSurface)[keyof typeof AvalancheBedSurface];
export const FormatAvalancheBedSurface = (value: AvalancheBedSurface): string => {
  return reverseLookup(AvalancheBedSurface, value);
};
export const AvalancheTrigger = {
  'N-Natural': 'N',
  'U-Unknown': 'U',
  'AS-Skier': 'AS',
  'AR-Snowboarder': 'AR',
  'AM-Snowmobile': 'AM',
  'AW-Wildlife': 'AW',
  'AV-Vehicle': 'AV',
  '--': 'disabled',
  'NC-Cornice Fall': 'NC',
  'NE-Earthquake': 'NE',
  'NI-Ice fall': 'NI',
  'NL-Triggered by Loose Snow Avalanche': 'NL',
  'NS-Triggered by Slab Avalanche': 'NS',
  'NR-Rock fall': 'NR',
  'AI-Snowshoer': 'AI',
  'AF-Foot penetration': 'AF',
  'AK-Snowcat': 'AK',
  'NO-Unclassified natural trigger': 'NO',
  'AU-Unknown artificial trigger': 'AU',
  'AO-Unclassified artificial trigger': 'AO',
  'AA-Artillery': 'AA',
  'AE-Explosive triggered': 'AE',
  'AL-Avalauncher': 'AL',
  'AB-Air blast': 'AB',
  'AC-Human-caused cornice fall': 'AC',
  'AX-Gas exploder': 'AX',
  'AH-Explosives from helicopter': 'AH',
  'AP-Pre-placed, remotely detonated explosive': 'AP',
} as const;
export type AvalancheTrigger = (typeof AvalancheTrigger)[keyof typeof AvalancheTrigger];
export const FormatAvalancheTrigger = (value: AvalancheTrigger): string => {
  return reverseLookup(AvalancheTrigger, value);
};
export const AvalancheCause = {
  'c-Intentional': 'c',
  'u-Unintentional': 'u',
  'r-Remote': 'r',
  'y-Sympathetic': 'y',
} as const;
export type AvalancheCause = (typeof AvalancheCause)[keyof typeof AvalancheCause];
export const FormatAvalancheCause = (value: AvalancheCause): string => {
  return reverseLookup(AvalancheCause, value);
};
export const AvalancheTerminus = {
  'TP - Top of Path': 'TP',
  'MP - Middle of Path': 'MP',
  'BP - Bottom of Path': 'BP',
  'U - Unknown': 'U',
} as const;
export type AvalancheTerminus = (typeof AvalancheTerminus)[keyof typeof AvalancheTerminus];
export const FormatAvalancheTerminus = (value: AvalancheTerminus): string => {
  return reverseLookup(AvalancheTerminus, value);
};
export const AvalancheProblemDistribution = {
  Unknown: 'unknown',
  Isolated: 'isolated',
  Specific: 'specific',
  Widespread: 'widespread',
} as const;
export type AvalancheProblemDistribution = (typeof AvalancheProblemDistribution)[keyof typeof AvalancheProblemDistribution];
export const FormatAvalancheProblemDistribution = (value: AvalancheProblemDistribution): string => {
  return reverseLookup(AvalancheProblemDistribution, value);
};
export const AvalancheProblemSensitivity = {
  Unknown: 'unknown',
  Unreactive: 'unreactive',
  Stubborn: 'stubborn',
  Reactive: 'reactive',
  Touchy: 'touchy',
} as const;
export type AvalancheProblemSensitivity = (typeof AvalancheProblemSensitivity)[keyof typeof AvalancheProblemSensitivity];
export const FormatAvalancheProblemSensitivity = (value: AvalancheProblemSensitivity): string => {
  return reverseLookup(AvalancheProblemSensitivity, value);
};
export const PartnerType = {
  Forecaster: 'forecaster',
  Intern: 'intern',
  Professional: 'professional',
  Observer: 'observer',
  Educator: 'educator',
  Volunteer: 'volunteer',
  Public: 'public',
  Other: 'other',
} as const;
export type PartnerType = (typeof PartnerType)[keyof typeof PartnerType];
export const FormatPartnerType = (value: PartnerType): string => {
  return reverseLookup(PartnerType, value);
};

export const ObservationSource = {
  Public: 'public',
  Dashboard: 'dashboard',
  Widget: 'widget',
  Avy: 'avy_app',
} as const;

export const instabilitySchema = z.object({
  avalanches_observed: z.boolean().optional(/* only because of NWAC */),
  avalanches_triggered: z.boolean().optional(/* only because of NWAC */),
  avalanches_caught: z.boolean().optional(/* only because of NWAC */),
  cracking: z.boolean().optional(/* only because of NWAC */),
  cracking_description: z.nativeEnum(InstabilityDistribution).or(z.string().length(0)).nullable().optional(),
  collapsing: z.boolean().optional(/* only because of NWAC */),
  collapsing_description: z.nativeEnum(InstabilityDistribution).or(z.string().length(0)).nullable().optional(),
});

export const avalancheObservationSchema = z.object({
  date: z.string().nullable().optional(/* only because of NWAC */),
  date_known: z.boolean().nullable().optional(/* only because of NWAC */),
  time: z.string().nullable().optional(/* only because of NWAC */),
  time_known: z.boolean().nullable().optional(/* only because of NWAC */),
  location: z.string().nullable().optional(/* only because of NWAC */),
  number: z.number().nullable().optional(/* only because of NWAC */),
  avalanche_type: z.nativeEnum(AvalancheType).or(z.string().length(0)).nullable().optional(),
  cause: z.nativeEnum(AvalancheCause).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
  terminus: z.nativeEnum(AvalancheTerminus).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
  trigger: z.nativeEnum(AvalancheTrigger).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
  avg_crown_depth: z.number().nullable().optional(),
  d_size: z.string().nullable().optional(/* only because of NWAC */),
  r_size: z.string().nullable().optional(/* only because of NWAC */),
  bed_sfc: z.nativeEnum(AvalancheBedSurface).or(z.string().length(0)).nullable().optional(),
  elevation: z.number().or(z.string()).nullable().optional(/* only because of NWAC */),
  vertical_fall: z.number().or(z.string()).nullable().optional(),
  width: z.number().nullable().optional(/* only because of NWAC */),
  slope_angle: z.number().nullable().optional(),
  aspect: z.nativeEnum(AvalancheAspect).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
  weak_layer_type: z.string().nullable().optional(), // TODO: this is clearly an enum somewhere, it's not anywhere I can see..
  weak_layer_date: z.string().nullable().optional(),
  comments: z.string().nullable().optional(/* only because of NWAC */),
  media: z.array(mediaItemSchema).optional(/* only because of NWAC */),
});

export const locationSchema = z.object({
  lng: z.number().nullable(/* TODO confirm why there are 2 obs like this, are they flukes? */).optional(/* only for NWAC obs */),
  lat: z.number().nullable(/* TODO confirm why there are 2 obs like this, are they flukes? */).optional(/* only for NWAC obs */),
});

// from the client-side schema at https://github.com/NationalAvalancheCenter/nac-vue-component-library/blob/main/constants/observations.js
export const observationSchema = z.object({
  id: z.string().optional(/* only because of NWAC */),
  organization: z.string().nullable().optional(/* only because of NWAC */),
  center_id: z.preprocess(s => String(s).toUpperCase(), avalancheCenterIDSchema),
  observer_type: z.nativeEnum(PartnerType),
  status: z.string().default('published'),
  private: z.boolean().default(false),
  name: z.string().nullable().optional(/* only because of NWAC */),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  created_at: z.string().nullable(),
  last_updated: z.string().nullable().optional(/* only because of NWAC */),
  start_date: z.string(),
  end_date: z.string().nullable().optional(/* only because of NWAC */),
  activity: z.array(z.nativeEnum(Activity)).optional(/* only because of NWAC */),
  location_point: locationSchema,
  location_name: z.string().optional(/* only because of NWAC */),
  route: z.string().nullable().optional(/* only because of NWAC */),
  instability: instabilitySchema,
  instability_summary: z.string().nullable().optional(/* only because of NWAC */),
  observation_summary: z.string().nullable().optional(/* only because of NWAC */),
  obs_source: z.nativeEnum(ObservationSource).optional(),
  media: z.array(mediaItemSchema).nullable().optional(/* only because of NWAC */),
  avalanches_summary: z.string().nullable().optional(/* only because of NWAC */),
  urls: z.array(z.string()).optional(/* only because of NWAC */),
  avalanches: z.array(avalancheObservationSchema).nullable().optional(/* only because of NWAC */),
  advanced_fields: z
    .object({
      observed_terrain: z.string().nullable().optional(/* only because of NWAC */),
      weather: z
        .object({
          air_temp: z.string().nullable().optional(/* only because of NWAC */),
          cloud_cover: z.nativeEnum(CloudCover).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
          recent_snowfall: z.string().nullable().optional(/* only because of NWAC */),
          rain_elevation: z.string().nullable().optional(/* only because of NWAC */),
          snow_avail_for_transport: z.nativeEnum(SnowAvailableForTransport).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
          wind_loading: z.nativeEnum(WindLoading).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
        })
        .nullable()
        .optional(/* only because of NWAC */),
      weather_summary: z.string().nullable().optional(/* only because of NWAC */),
      snowpack: z.object({}).nullable().optional(/* only because of NWAC */), // TODO: what's in here?
      snowpack_summary: z.string().nullable().optional(/* only because of NWAC */),
      snowpack_media: z.array(mediaItemSchema).optional(/* only because of NWAC */),
      avalanche_problems: z
        .array(
          z.object({
            rank: z.number().optional(),
            type: z.nativeEnum(AvalancheProblemName).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
            depth: z.string().nullable().optional(/* only because of NWAC */),
            layer: z.string().nullable().optional(/* only because of NWAC */),
            location: z.array(avalancheProblemLocationSchema).nullable().optional(/* only because of NWAC */),
            distribution: z.nativeEnum(AvalancheProblemDistribution).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
            sensitivity: z.nativeEnum(AvalancheProblemSensitivity).or(z.string().length(0)).nullable().optional(/* only because of NWAC */),
            d_size: z.array(z.string().or(z.number())).nullable().optional(/* only because of NWAC */),
            comments: z.string().nullable().optional(/* only because of NWAC */),
          }),
        )
        .optional(/* only because of NWAC */),
      avalanche_problems_comments: z.string().nullable().optional(/* only because of NWAC */),
      terrain_use: z.string().nullable().optional(/* only because of NWAC */),
      bottom_line: z.string().nullable().optional(/* only because of NWAC */),
      danger_rating: z
        .object({
          rating: z.array(
            z.object({
              upper: z.number(),
              middle: z.number(),
              loweer: z.number(),
            }),
          ),
          confidence: z.nativeEnum(DangerConfidence).or(z.string().length(0)),
          trend: z.nativeEnum(DangerTrend).or(z.string().length(0)),
        })
        .optional(),
    })
    .nullable()
    .optional(/* only because of NWAC */),
});
export type Observation = z.infer<typeof observationSchema>;

export const observationFragmentSchema = z.object({
  id: z.string(),
  observerType: z.nativeEnum(PartnerType),
  name: z.string(),
  startDate: z.string(),
  locationPoint: locationSchema,
  locationName: z.string(),
  instability: instabilitySchema,
  observationSummary: z.string(),
  media: z.array(mediaItemSchema),
});
export type ObservationFragment = z.infer<typeof observationFragmentSchema>;

export const observationListResultSchema = z.object({
  data: z
    .object({
      getObservationList: z.array(observationFragmentSchema),
    })
    .nullable(),
  errors: z.array(z.any()).optional(),
});
export type ObservationListResult = z.infer<typeof observationListResultSchema>;

export const nwacObservationSchema = observationSchema.extend({
  zone: z.string().optional(),
  visible: z.boolean(),
  id: z.number().transform(n => String(n)),
});
export type NWACObservation = z.infer<typeof nwacObservationSchema>;

export const nwacObservationsListSchema = z.object({
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
      content: nwacObservationSchema,
    }),
  ),
});
export type NWACObservationListResult = z.infer<typeof nwacObservationsListSchema>;

export const nwacObservationResultSchema = z.object({
  meta: z.object({
    limit: z.number().optional().nullable(),
    next: z.string().optional().nullable(),
    offset: z.number().optional().nullable(),
    previous: z.string().optional().nullable(),
    total_count: z.number().optional().nullable(),
  }),
  objects: z.object({
    id: z.number(),
    post_type: z.string(),
    post_date: z.string(),
    content: nwacObservationSchema,
  }),
});
export type NWACObservationResult = z.infer<typeof nwacObservationResultSchema>;

export const avyPositionSchema = z.object({
  longitude: z.number(),
  latitude: z.number(),
});
export type AvyPosition = z.infer<typeof avyPositionSchema>;

export const bBoxSchema = z.union([z.tuple([z.number(), z.number(), z.number(), z.number()]), z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()])]);
export type BBox = z.infer<typeof bBoxSchema>;

export const positionSchema = z.array(z.number());
export type Position = z.infer<typeof positionSchema>;

export const geoJsonPropertiesSchema = z.record(z.any()).nullable();
export type GeoJsonProperties = z.infer<typeof geoJsonPropertiesSchema>;

export const geoJsonGeometryTypesSchema = z.enum(['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection']);
export type GeoJsonGeometryTypes = z.infer<typeof geoJsonGeometryTypesSchema>;

export const geoJsonTypesSchema = z.enum(['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection', 'Feature', 'FeatureCollection']);
export type GeoJsonTypes = z.infer<typeof geoJsonTypesSchema>;
export const geoJsonObjectSchema = z.object({
  type: geoJsonTypesSchema,
  bbox: z.union([bBoxSchema, z.undefined()]).optional(),
});
export type GeoJsonObject = z.infer<typeof geoJsonObjectSchema>;

export const pointSchema = geoJsonObjectSchema.extend({
  type: z.literal('Point'),
  coordinates: positionSchema,
});
export type Point = z.infer<typeof pointSchema>;

export const multiPointSchema = geoJsonObjectSchema.extend({
  type: z.literal('MultiPoint'),
  coordinates: z.array(positionSchema),
});
export type MultiPoint = z.infer<typeof multiPointSchema>;

export const lineStringSchema = geoJsonObjectSchema.extend({
  type: z.literal('LineString'),
  coordinates: z.array(positionSchema),
});
export type LineString = z.infer<typeof lineStringSchema>;

export const multiLineStringSchema = geoJsonObjectSchema.extend({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(positionSchema)),
});
export type MultiLineString = z.infer<typeof multiLineStringSchema>;

export const polygonSchema = geoJsonObjectSchema.extend({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(positionSchema)),
});
export type Polygon = z.infer<typeof polygonSchema>;

export const multiPolygonSchema = geoJsonObjectSchema.extend({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(positionSchema))),
});
export type MultiPolygon = z.infer<typeof multiPolygonSchema>;

export const geometrySchema = z.discriminatedUnion('type', [
  pointSchema,
  multiPointSchema,
  lineStringSchema,
  multiLineStringSchema,
  polygonSchema,
  multiPolygonSchema,
  // geometryCollectionSchema, // TODO(skuznets): likely does not matter for us but technically this can nest recursively forever, but we get weird block-scoped variable issues with trying to model that here
]);
export type Geometry = z.infer<typeof geometrySchema>;

export const geometryCollectionSchema = geoJsonObjectSchema.extend({
  type: z.literal('GeometryCollection'),
  geometries: z.array(geometrySchema),
});
export type GeometryCollection = z.infer<typeof geometryCollectionSchema>;

export const featureSchema = <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(propertiesSchema: T, idSchema: U) =>
  geoJsonObjectSchema.extend({
    type: z.literal('Feature'),
    geometry: geometrySchema,
    id: idSchema,
    properties: propertiesSchema,
  });

export const pointFeatureSchema = <T extends z.ZodTypeAny, U extends z.ZodTypeAny>(propertiesSchema: T, idSchema: U) =>
  geoJsonObjectSchema.extend({
    type: z.literal('Feature'),
    geometry: pointSchema,
    id: idSchema,
    properties: propertiesSchema,
  });

export const featureCollectionSchema = <T extends z.ZodTypeAny>(featureSchema: T) =>
  geoJsonObjectSchema.extend({
    type: z.literal('FeatureCollection'),
    features: z.array(featureSchema),
  });

export const mapLayerFeatureSchema = featureSchema(mapLayerPropertiesSchema, z.number());
export type MapLayerFeature = z.infer<typeof mapLayerFeatureSchema>;
export const mapLayerSchema = featureCollectionSchema(mapLayerFeatureSchema).extend({
  start_time: z.null(),
  end_time: z.null(),
});
export type MapLayer = z.infer<typeof mapLayerSchema>;

export const mapFeaturesForCenter = (allMapLayer: MapLayer | undefined, centerId: AvalancheCenterID): MapLayerFeature[] =>
  allMapLayer?.features.filter(feature => feature.properties.center_id === centerId) ?? [];

export const WeatherStationSource = {
  NWAC: 'nwac',
  MESOWEST: 'mesowest',
  SNOTEL: 'snotel',
} as const;
export type WeatherStationSource = (typeof WeatherStationSource)[keyof typeof WeatherStationSource];

export const StationColorNameForSource = (source: WeatherStationSource) => {
  switch (source) {
    case WeatherStationSource.NWAC:
      return 'weather.nwac.primary';
    case WeatherStationSource.SNOTEL:
      return 'weather.snotel.primary';
    case WeatherStationSource.MESOWEST:
      return 'weather.mesowest.primary';
  }
};

export const NWACWeatherStationStatus = {
  Active: 'active',
  Inactive: 'inactive',
  Static: 'static',
} as const;
export type NWACWeatherStationStatus = (typeof NWACWeatherStationStatus)[keyof typeof NWACWeatherStationStatus];

export const WeatherStationStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;
export type WeatherStationStatus = (typeof WeatherStationStatus)[keyof typeof WeatherStationStatus];

export const stationNoteSchema = z.object({
  stid: z.string(),
  id: z.string(),
  client_id: z.number(),
  date_updated: z.string(),
  start_date: z.string(),
  status: z.nativeEnum(NWACWeatherStationStatus),
  history: z.string().nullable(),
  date_created: z.string(),
  end_date: z.string().nullable(),
  note: z.string(),
});
export type StationNote = z.infer<typeof stationNoteSchema>;

export const nwacWeatherStationPropertiesSchema = z.object({
  source: z.literal(WeatherStationSource.NWAC),
  id: z.string(),
  stid: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number(),
  timezone: z.string(),
  station_note: z.array(stationNoteSchema),
  data: z.record(z.string(), z.string().or(z.number()).or(z.null())),
});

export const mesowestWeatherStationPropertiesSchema = z.object({
  source: z.literal(WeatherStationSource.MESOWEST),
  id: z.string(),
  stid: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number(),
  timezone: z.string(),
});

export const snotelWeatherStationPropertiesSchema = z.object({
  source: z.literal(WeatherStationSource.SNOTEL),
  id: z.string(),
  stid: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number(),
  timezone: z.string(),
});

export const weatherStationPropertiesSchema = z.discriminatedUnion('source', [
  nwacWeatherStationPropertiesSchema,
  mesowestWeatherStationPropertiesSchema.extend({
    data: z.record(z.string(), z.string().or(z.number()).or(z.null())),
  }),
  snotelWeatherStationPropertiesSchema.extend({
    data: z.record(z.string(), z.string().or(z.number()).or(z.null())),
  }),
]);
export type WeatherStationProperties = z.infer<typeof weatherStationPropertiesSchema>;

export const variableSchema = z.object({
  variable: z.string(),
  long_name: z.string(),
});
export type Variable = z.infer<typeof variableSchema>;
export const variablesSchema = z.array(variableSchema);
export const unitSchema = z.record(z.string(), z.string());
export const weatherStationCollectionPropertiesSchema = z.object({
  variables: variablesSchema,
  units: unitSchema,
});

export const weatherStationSchema = pointFeatureSchema(weatherStationPropertiesSchema, z.number().or(z.string()).nullable().optional());
export type WeatherStation = z.infer<typeof weatherStationSchema>;
export const weatherStationCollectionSchema = featureCollectionSchema(weatherStationSchema).extend({
  properties: weatherStationCollectionPropertiesSchema,
});
export type WeatherStationCollection = z.infer<typeof weatherStationCollectionSchema>;

export const weatherStationObservationSchema = z.array(z.record(z.string(), z.string().or(z.number()).nullable()));
export const weatherStationTimeseriesEntrySchema = z.discriminatedUnion('source', [
  nwacWeatherStationPropertiesSchema.omit({data: true}).extend({observations: weatherStationObservationSchema}),
  mesowestWeatherStationPropertiesSchema.extend({observations: weatherStationObservationSchema}),
  snotelWeatherStationPropertiesSchema.extend({observations: weatherStationObservationSchema}),
]);
export type WeatherStationTimeseriesEntry = z.infer<typeof weatherStationTimeseriesEntrySchema>;
export const weatherStationTimeseriesSchema = z.object({
  STATION: z.array(weatherStationTimeseriesEntrySchema),
  UNITS: unitSchema,
  VARIABLES: variablesSchema,
});
export type WeatherStationTimeseries = z.infer<typeof weatherStationTimeseriesSchema>;

export const avalancheCenterPlatformsSchema = z.object({
  warnings: z.boolean(),
  forecasts: z.boolean(),
  stations: z.boolean(),
  obs: z.boolean(),
  weather: z.boolean(),
});
export type AvalancheCenterPlatforms = z.infer<typeof avalancheCenterPlatformsSchema>;

export const avalancheCenterCapabilitiesSchema = z.object({
  id: z.string(),
  display_id: z.string(),
  platforms: avalancheCenterPlatformsSchema,
});
export type AvalancheCenterCapabilities = z.infer<typeof avalancheCenterCapabilitiesSchema>;

export const allAvalancheCenterCapabilitiesSchema = z.object({
  centers: z.array(avalancheCenterCapabilitiesSchema),
});
export type AllAvalancheCenterCapabilities = z.infer<typeof allAvalancheCenterCapabilitiesSchema>;
