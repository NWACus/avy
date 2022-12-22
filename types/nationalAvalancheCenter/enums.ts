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
  Weather = 'weather',
  Synopsis = 'synopsis',
  Summary = 'summary',
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
  Glide = 'Glide Avalanches',
}

export enum AvalancheProblemLikelihood {
  Unlikely = 'unlikely',
  Possible = 'possible',
  Likely = 'likely',
  VeryLikely = 'very likely',
  AlmostCertain = 'almost certain',
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
  // TODO(skuznets): more exist, no idea what they are
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
