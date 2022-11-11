// TimeSeriesResponse holds the response for a timeseries request to the SnowBound API
import {Units} from './nationalAvalancheCenter';

export interface TimeSeriesResponse {
  msg: string;
  status: string;
  station_timeseries: StationTimeSeries;
}

// StationTimeSeries holds time series data for a data-logger along with metadata for the observations.
// TODO(skuznets): stop allowing `| string` when we nail down all the possibilities
export interface StationTimeSeries {
  // Summary holds a mapping of attributes, with station-specific entries and variable data types.
  SUMMARY: Record<NWACSummaryKey | string, any>;
  // UNITS holds a mapping from Center ID to variable name to the unit, for instance:
  // {"nwac": {"air_temp": "farenheit"}}
  UNITS: Record<SourceIdentifier | string, Record<Variable | string, Unit | string>>;
  // VARIABLES is a super-set of UNITS, holding metadata about data-logger variables.
  VARIABLES: Record<SourceIdentifier | string, Record<Variable | string, VariableMetadata>>;
  // STATION holds the requested data, mapped by the station producing it.
  STATION: StationMetadataForTimeSeries[];
}

// VariableMetadata holds metadata for a data-logger variable.
export interface VariableMetadata {
  id: number;
  long_name: string;
  rounding: number;
  tab: string;
  source: SourceIdentifier | string;
  units: Unit | string;
  variable: Variable | string;
}

// CenterIdentifier identifies a source for a data-logger.
export enum SourceIdentifier {
  NWAC = 'nwac',
}

// Variable names a measurement variable from a data-logger.
export enum Variable {
  AirTemperature = 'air_temp',
  EquipmentTemperature = 'equip_temperature',
  IntermittentSnow = 'intermittent_snow',
  NetSolar = 'net_solar',
  PrecipitationAccumulationOneHour = 'precip_accum_one_hour',
  PrecipitationCumulativeSum = 'precip_cumsum',
  Pressure = 'pressure',
  RelativeHumidity = 'relative_humidity',
  SnowDepth = 'snow_depth',
  SnowDepth24h = 'snow_depth_24h',
  SnowDepth24hr = 'snow_depth_24hr',
  SolarRadiation = 'solar_radiation',
  WindDirection = 'wind_direction',
  WindGust = 'wind_gust',
  WindSpeed = 'wind_speed',
  WindSpeedMin = 'wind_speed_min',
}

export enum Unit {
  DegreesFarenheit = 'fahrenheit',
  DegreesOrdinal = 'degrees',
  Inches = 'Inches',
  MilliJoulesPerSquareMeter = 'mJ/m2',
  WattsPerSquareMeter = 'W/m2',
  MilliBar = 'millibar',
  Percent = '%',
  MilesPerHour = 'mph',
}

// NWACSummaryKeys are NWAC-specific keys for the station summary metadata.
export enum NWACSummaryKey {
  DataParsingTime = 'NWAC_DATA_PARSING_TIME',
  DataQueryTime = 'NWAC_DATA_QUERY_TIME',
  MetadataResponseTime = 'NWAC_METADATA_RESPONSE_TIME',
  NumberOfObjects = 'NWAC_NUMBER_OF_OBJECTS',
  TotalDataTime = 'NWAC_TOTAL_DATA_TIME',
}

// TODO(skuznets): why are the JSON fields here not the same case as when we get a station by itself? the data is identical...
// we can either hold on to two interfaces forever, or perhaps there's some way to get a custom JSON parser into axios that
// would support JSON field aliasing ... https://pichillilorenzo.github.io/jackson-js/latest/modules/decorators.html#jsonalias
export interface StationMetadataForTimeSeries {
  CLIENT_ID: number;
  CUSTOM_ATTRIBUTES: any; // arbitrarily nested ?
  ELEVATION: number; // in feet above sea level
  ID: number;
  LOCATION_STYLE_ID: number;
  LATITUDE: number;
  LONGITUDE: number;
  MESSAGES: StationMessage[];
  MNET_ID: any; // TODO: can be null
  OBSERVATIONS: Record<Variable | string, any[]>; // the type of the data array depends on the variable
  PLOT_TYPE: PlotType;
  SNOWOBS: SnowObsMetadata;
  NAME: string;
  SOURCE: SourceIdentifier | string;
  SOURCE_ID: any; // TODO: can be null
  STATE: string; // two-letter state code
  STATUS: StationStatus;
  STID: number; // station identifier we used in the query parameters to get this data
  STYLE: StationStyle;
  TIMEZONE: string; // three-letter timezone code
}

export enum PlotType {
  Default = 'default',
}

export interface StationMessage {
  datalogger_id: number;
  date: string; // YYYY-MM-DD
  node: string;
}

export interface SnowObsMetadata {
  id: number;
  name: string;
  plot_type: PlotType;
}

export enum StationStatus {
  Active = 'active',
  ACTIVE = 'ACTIVE',
  Inactive = 'inactive',
  INACTIVE = 'INACTIVE',
}

export const stationActive = (status: StationStatus): boolean => {
  return status == StationStatus.ACTIVE || status == StationStatus.Active;
};

export interface StationStyle {
  client_id: number;
  fill_color: string; // hex color code
  id: number;
  name: string;
  stroke_color: string; // hex color code
  symbol: string;
}

export interface StationResponse {
  status: string;
  total: number;
  pages: number;
  current_page: number; // 1-indexed
  results: StationMetadata[];
}

export interface StationMetadata {
  client_id: number;
  custom_attributes: any; // arbitrarily nested ?
  elevation: number; // in feet above sea level
  id: number;
  location_style_id: number;
  latitude: number;
  longitude: number;
  messages: StationMessage[];
  mnet_id: any; // TODO: can be null
  plot_type: PlotType;
  snowobs: SnowObsMetadata;
  name: string;
  source: SourceIdentifier | string;
  source_id: any; // TODO: can be null
  state: string; // two-letter state code
  status: StationStatus;
  stid: number; // station identifier we used in the query parameters to get this data
  style: StationStyle;
  timezone: string; // three-letter timezone code
}
