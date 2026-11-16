// Copied from NWACus/web src/services/nac/model/nwacWeather.ts. Keep in sync: change it there first, then copy it here.
/**
 * The NWAC weather model components render. Grids are keyed for lookup (`temp[zoneId][periodKey]`)
 * and every axis carries its calendar date.
 */

export type NWACWeatherIssuanceType = 'morning' | 'afternoon';

export interface NWACWeatherZone {
  id: string;
  name: string;
  /** The NAC avalanche zone this weather zone corresponds to, when the names match. */
  avalancheZoneId: number | null;
}

export interface NWACWeatherPoint {
  code: string;
  name: string;
  zoneId: string | null;
  zoneName: string;
  avalancheZoneId: number | null;
}

export interface NWACWeatherPeriod {
  key: string;
  label: string;
  short: string | null;
  kind: 'day' | 'night';
  /** `YYYY-MM-DD` */
  date: string;
  /** Whether the issuance forecasts precipitation for this period. */
  precip: boolean;
}

export interface NWACWeatherBlock {
  key: string;
  label: string;
  /** Morning / Afternoon / Evening / Night */
  part: string;
  /** The 12h period this 6h block belongs to. */
  period: string | null;
}

export interface NWACWeatherExtendedBlock {
  key: string;
  label: string;
  part: string;
  /** `YYYY-MM-DD` */
  date: string;
}

export interface NWACWeatherPrecipCell {
  qpf: number | null;
  /** Snow-to-liquid ratio (12 → 12:1); 0 is the rain marker. Snow = qpf × slr. */
  slr: number | null;
}
export interface NWACWeatherTempCell {
  high: number | null;
  low: number | null;
}
export interface NWACWeatherWindCell {
  dir: string | null;
  speed: number | null;
}
export interface NWACWeatherLevelCell {
  freezing: number | null;
  mode: string | null;
}

/** `outer id → slot key → cell` */
export type NWACWeatherGrid<Cell> = Record<string, Record<string, Cell>>;

export interface NWACWeatherIssuance {
  id: number;
  type: NWACWeatherIssuanceType;
  /** ISO instant. */
  issuedAt: string;
  /** `YYYY-MM-DD` — Day 1 of the forecast. */
  serviceDate: string;
  author: string | null;
  /** Forecaster-authored HTML; sanitize before rendering. */
  synopsis: string | null;
  extendedOutlook: string | null;
  zones: NWACWeatherZone[];
  points: NWACWeatherPoint[];
  periods: NWACWeatherPeriod[];
  blocks: NWACWeatherBlock[];
  extendedBlocks: NWACWeatherExtendedBlock[];
  /** by point code, then period key */
  precip: NWACWeatherGrid<NWACWeatherPrecipCell>;
  /** by zone id, then period key */
  temp: NWACWeatherGrid<NWACWeatherTempCell>;
  /** by zone id, then block key */
  wind: NWACWeatherGrid<NWACWeatherWindCell>;
  snowLevel: NWACWeatherGrid<NWACWeatherLevelCell>;
  /** by zone id, then extended block key */
  extendedSnowLevel: NWACWeatherGrid<NWACWeatherLevelCell>;
  /** by zone id, then slot (`morning` = Today / Tonight, `afternoon` = Tomorrow) */
  sensible: NWACWeatherGrid<string>;
}

/** Every issuance published for one forecast date, newest first. */
export interface NWACWeatherForecastDay {
  serviceDate: string;
  issuances: NWACWeatherIssuance[];
}
