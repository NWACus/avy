// MapLayer describes forecast zones to be drawn for an avalanche center
import { Mutation } from "react-query";

export interface MapLayer {
  type: string; // TODO(skuznets): is this ever something other than 'FeatureCollection'?
  features: Feature[];

  // TODO(skuznets): the following fields exist in the response but are never set, no idea if they are useful or what their type is
  // start_time: string;
  // end_time: string;
}

// Feature is a representation of a forecast zone
export interface Feature {
  type: string; // TODO(skuznets): is this ever something other than 'Feature'?
  id: number;
  properties: FeatureProperties;
  geometry: FeatureComponent;
}

// FeatureProperties contains three types of metadata about the forecast zone:
// - static information like the name of the zone and timezone
// - dynamic information like the current forecast and travel advice
// - consumer directions for how to render the feature, like fill color & stroke
export interface FeatureProperties {
  name: string;
  center_id: string;
  center_link: string;
  state: string;
  link: string;

  off_season: boolean;
  travel_advice: string;

  danger: string;
  danger_level: DangerLevel;
  // start_date and end_date are RFC3339 timestamps that bound the current forecast
  start_date: string;
  end_date: string;

  warning: Warning;

  color: string; // TODO(skuznets): encode that this is a hex color in the type?
  stroke: string; // TODO(skuznets): encode that this is a hex color in the type?
  font_color: string; // TODO(skuznets): encode that this is a hex color in the type?
  fillOpacity: number;
  fillIncrement: number;
}

export enum DangerLevel {
  GeneralInformation = -1,
  None,
  Low,
  Moderate,
  Considerable,
  High,
  Extreme,
}

export const dangerIcon = (level: DangerLevel): string => {
  let display: number = level;
  if (level === DangerLevel.GeneralInformation) {
    display = DangerLevel.None;
  }
  return `https://nac-web-platforms.s3.us-west-1.amazonaws.com/assets/danger-icons/${display}.png`;
};

export const dangerText = (level: DangerLevel): string => {
  let display: DangerLevel = level;
  let prefix: string;
  switch (level) {
    case DangerLevel.Extreme:
      prefix = 'Extreme';
      break;
    case DangerLevel.High:
      prefix = 'High';
      break;
    case DangerLevel.Considerable:
      prefix = 'Considerable';
      break;
    case DangerLevel.Moderate:
      prefix = 'Moderate';
      break;
    case DangerLevel.Low:
      prefix = 'Low';
      break;
    case DangerLevel.None:
    case DangerLevel.GeneralInformation:
    default:
      prefix = 'No rating';
      display = DangerLevel.None;
  }
  return `${prefix} (${display})`;
};

// coordinates encodes a list of points, each as a two-member array [longitude,latitude]
// for a type=Polygon, this a three-dimensional array number[][][]
// for a type=MultiPolygon, this a four-dimensional array number[][][][]
export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export type FeatureComponent = Polygon | MultiPolygon;

export interface Warning {
  product: Product;
}

export enum ProductType {
  Forecast = 'forecast',
  Warning = 'warning',
  Synopsis = 'synopsis',
}

export enum ProductStatus {
  Published = 'published',
  // TODO(skuznets): more exist, no idea what they are
}

export interface Product {
  id: number;
  product_type: ProductType;
  status: ProductStatus;
  author: string;

  published_time: string; // RFC3339 timestamp
  expires_time: string; // RFC3339 timestamp
  created_at: string; // RFC3339 timestamp
  updated_at: string; // RFC3339 timestamp

  announcement: string;
  bottom_line: string;
  forecast_avalanche_problems: AvalancheProblem[];
  hazard_discussion: string;
  danger: AvalancheDangerForecast[];
  weather_discussion: string;
  weather_data: any; // TODO(skuznets) not sure what the schema is, this is null for NWAC
  media: MediaItem[];

  avalanche_center: AvalancheCenterMetadata;
  forecast_zone: AvalancheForecastZoneSummary[];
}

export interface AvalancheProblem {
  id: number;
  forecast_id: number;
  rank: number; // order in which to display these on the forecast
  avalanche_problem_id: AvalancheProblemType;
  name: AvalancheProblemName;
  likelihood: AvalancheProblemLikelihood;
  location: AvalancheProblemLocation[];
  size: AvalancheProblemSize[];
  discussion: string;
  problem_description: string;
  icon: string;
  media: MediaItem;
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

export interface AvalancheDangerForecast {
  lower: DangerLevel;
  middle: DangerLevel;
  upper: DangerLevel;
  valid_day: ForecastPeriod;
}

export enum ForecastPeriod {
  Current = 'current',
  Tomorrow = 'tomorrow',
}

export enum MediaType {
  Image = 'image',
  // TODO(skuznets): more exist, no idea what they are
}

export interface MediaItem {
  id: number; // this is an index-based ID for the product that media are attached to
  url: MediaLinks;
  type: MediaType;
  caption: string;
}

export interface MediaLinks {
  large: string;
  medium: string;
  original: string;
  thumbnail: string;
}

export interface AvalancheCenterMetadata {
  id: string;
  name: string;
  url: string;
  city: string;
  state: string;
}

export interface AvalancheForecastZoneSummary {
  id: number;
  name: string;
  url: string;
  state: string;
  zone_id: number;
}

export interface AvalancheCenter {
  id: string;
  name: string;
  url: string;
  city: string;
  state: string;
  timezone: string;
  email: string;
  phone: string;

  config: AvalancheCenterConfiguration;
  type: AvalancheCenterType;
  widget_config: AvalancheCenterWidgetConfiguration;

  created_at: string; // RFC3339 timestamps
  zones: AvalancheForecastZone[];
  nws_zones: NationalWeatherServiceZone[];
  nws_offices: string[];

  web_geometry: any; // TODO(skuznets) is this always `null`?
  center_point: any; // TODO(skuznets) is this always `null`?
  off_season: boolean; // TODO(skuznets) this seems to not be accurate
}

export enum AvalancheCenterType {
  USFS = 'usfs',
  State = 'state',
  Volunteer = 'volunteer',
}

export interface AvalancheCenterConfiguration {
  // expires_time and published_time seem to be fractional hours past midnight, in the locale
  expires_time: number;
  published_time: number;
  blog: boolean;
  weather_table: AvalancheCenterWeatherConfiguration[];
  zone_order: string[];
}

export interface AvalancheCenterWeatherConfiguration {
  autofill: any; // TODO(skuznets) is this always `null`?
  zone_id: number; // this is the index in the list
  forecast_point: LatLng; // TODO(skuznets) is this always `null`?
  forecast_url: any; // TODO(skuznets) is this always `null`?
}

export interface LatLng {
  latitude: number | null;
  longitude: number | null;
}

export interface AvalancheCenterWidgetConfiguration {
  forecast: AvalancheCenterForecastWidgetConfiguration;
  danger_map: AvalancheCenterDangerMapWidgetConfiguration;
  stations: AvalancheCenterStationsWidgetConfiguration;
}

export interface AvalancheCenterForecastWidgetConfiguration {
  color: string;
  elevInfoUrl: string;
  glossary: boolean;
  tabs: AvalancheCenterForecastWidgetTab[];
}

export interface AvalancheCenterForecastWidgetTab {
  name: string;
  id: string;
  url: string;
}

export interface AvalancheCenterDangerMapWidgetConfiguration {
  height: number;
  saturation: number;
  search: boolean;
  geolocate: boolean;
  advice: boolean;
  center: LatLng;
  zoom: number;
}

export enum Units {
  English = 'english',
  // TODO: what else?
}

export interface AvalancheCenterStationsWidgetConfiguration {
  center: LatLng;
  zoom: number;
  center_id: string;
  alternate_zones: any; // TODO: won't be null somewhere
  units: Units;
  timezone: string; // TODO: special value 'local' here
  color_rules: boolean;
  source_legend: boolean;
  sources: string;
  within: number;
  external_modal_links: Record<string, ExternalModalLink>;
  token: string; // TODO: uh-oh
}

export interface ExternalModalLink {
  area_plots: string;
  area_tables: string;
}

export enum AvalancheForecastZoneStatus {
  Active = 'active',
  Disabled = 'disabled',
}

export interface AvalancheForecastZone {
  id: number;
  name: string;
  url: string;
  zone_id: string;
  config: AvalancheForecastZoneConfiguration;
  status: AvalancheForecastZoneStatus;
  rank: number;
}

export interface AvalancheForecastZoneConfiguration {
  elevation_band_names: ElevationBandNames;
}

export interface ElevationBandNames {
  lower: string;
  middle: string;
  upper: string;
}

export interface NationalWeatherServiceZone {
  id: number;
  zone_name: string;
  zone_id: string;
  state: string;
  city: string;
  contact: string;
  zone_state: string;
}
