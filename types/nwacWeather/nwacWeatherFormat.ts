// Copied from NWACus/web src/services/nac/nwacWeatherFormat.ts. Keep in sync: change it there first, then copy it here.
// Local changes: absolute imports, and formatDateTime is defined below in place of @/utilities/formatDateTime.
/** How Mountain Weather values read on the page, matching the dashboard preview. Pure. */
import {format} from 'date-fns';
import type {NWACWeatherBlock, NWACWeatherGrid, NWACWeatherIssuance, NWACWeatherPeriod} from 'types/nwacWeather/nwacWeather';
import {formatInTimeZone} from 'utils/date';

const formatDateTime = (dateString: string, tz: string | null | undefined, formatStr: string) =>
  tz ? formatInTimeZone(dateString, tz, formatStr) : format(new Date(dateString), formatStr);

export const DASH = '—';

/** A zone's period is wet when any of its stations forecasts this much or more (inches). */
export const WET_QPF_IN = 0.01;

/**
 * Whether a block's level is a snow level or a freezing level, as the dashboard decides it: the
 * forecaster's pick when they made one, else snow when the zone's period is wet.
 */
export function levelKind(issuance: NWACWeatherIssuance, zoneId: string, block: NWACWeatherBlock): 'snow' | 'freezing' {
  const mode = issuance.snowLevel[zoneId]?.[block.key]?.mode;
  if (mode === 'snow' || mode === 'freezing') return mode;
  const period = block.period;
  const wet = period != null && issuance.points.some(p => p.zoneId === zoneId && (issuance.precip[p.code]?.[period]?.qpf ?? 0) >= WET_QPF_IN);
  return wet ? 'snow' : 'freezing';
}

/**
 * New snow in inches from water equivalent and snow-to-liquid ratio (slr 12 → 12:1). A dry period
 * (qpf 0, which needs no ratio) and the rain marker (slr 0) both derive 0, not "not forecast".
 */
export function deriveSnow(qpf: number | null | undefined, slr: number | null | undefined) {
  if (qpf === 0) return 0;
  if (qpf == null || slr == null || slr < 0) return null;
  return Math.round(qpf * slr * 10) / 10;
}

/**
 * The level as the forecaster typed it, with the snow/freezing designation as its label (the
 * old 1,000 ft "drop" derivation is retired; the API folds any stored drop in before serving).
 */
export function deriveSnowLevel(freezing: number | null | undefined) {
  if (freezing == null) return null;
  return Math.max(0, freezing);
}

/** Whole inches; under half an inch reads 0 rather than a trace mark. */
export function fmtSnowAmount(snow: number | null): string {
  if (snow == null) return DASH;
  if (snow < 0.5) return '0';
  return `${Math.round(snow)}"`;
}

/** Water equivalent in inches exactly as the forecaster entered it (0.4"); none reads as 0. */
export function fmtQpf(qpf: number | null | undefined): string {
  if (qpf == null) return DASH;
  if (qpf <= 0) return '0';
  return `${qpf}"`;
}

export function fmtWind(cell: {dir: string | null; speed: number | null} | undefined) {
  if (cell?.speed == null) return DASH;
  if (windWording(cell.speed) === 'Calm') return `${cell.dir ?? ''} Calm`.trim();
  return `${cell.dir ?? ''} ${cell.speed}`.trim();
}

/** Each band's top forecast speed (mph), the range the public reads and its sensible wording. */
const WIND_BANDS: {top: number; range: string; wording: string}[] = [
  {top: 4, range: '0–5', wording: 'Calm'},
  {top: 10, range: '5–10', wording: 'Light'},
  {top: 13, range: '10–15', wording: 'Light to occasionally Moderate'},
  {top: 17, range: '10–20', wording: 'Light to Moderate'},
  {top: 22, range: '15–25', wording: 'Moderate'},
  {top: 27, range: '20–30', wording: 'Moderate to Strong'},
  {top: 32, range: '25–35', wording: 'Strong'},
  {top: 37, range: '30–40', wording: 'Strong'},
  {top: 43, range: '35–45', wording: 'Strong to Extreme'},
  {top: 50, range: '40–55', wording: 'Extreme'},
  {top: 56, range: '45–60', wording: 'Extreme'},
  {top: 62, range: '50–70', wording: 'Extreme'},
  {top: 67, range: '55–75', wording: 'Extreme'},
  {top: 72, range: '60–80', wording: 'Extreme'},
  {top: 77, range: '65–85', wording: 'Extreme'},
  {top: 84, range: '70–90', wording: 'Extreme'},
  {top: 110, range: '85–110', wording: 'Extreme'},
];
const TOP_BAND = {top: Infinity, range: '110+', wording: 'Extreme'};

/** The forecasters' band for an entered speed; null when there is none. */
function windBand(speed: number | null | undefined) {
  if (speed == null) return null;
  const mph = Math.round(speed);
  return WIND_BANDS.find(band => mph <= band.top) ?? TOP_BAND;
}

/** The public reads wind as the forecasters' range for the entered speed (25 → 20–30). */
export function windRange(speed: number | null | undefined): string | null {
  return windBand(speed)?.range ?? null;
}

/** The sensible-weather word for the entered speed (25 → Moderate to Strong). */
export function windWording(speed: number | null | undefined): string | null {
  return windBand(speed)?.wording ?? null;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/** Degrees a compass point's wind blows from; null for variable, blank or unknown directions. */
export function windBearing(dir: string | null | undefined): number | null {
  const i = dir ? COMPASS.indexOf(dir.trim().toUpperCase()) : -1;
  return i < 0 ? null : i * 22.5;
}

export interface PeriodGroup {
  key: string;
  periods: NWACWeatherPeriod[];
  /** "Night only" / "Day only" for a period with no partner; null for a night and its day. */
  partial: string | null;
}

/**
 * The 12h periods folded into 24 hours the way forecasters read them, as the dashboard preview
 * does: each night with the day after it (afternoon: Night 1 + Day 2, Night 2 + Day 3; morning:
 * Day 1 alone, then Night 1 + Day 2). A period with no partner stands alone.
 */
export function dayGroups(periods: NWACWeatherPeriod[]): PeriodGroup[] {
  const groups: PeriodGroup[] = [];
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    const next = periods[i + 1];
    if (period.kind === 'night' && next?.kind === 'day') {
      groups.push({key: `${period.key}-${next.key}`, periods: [period, next], partial: null});
      i++;
    } else {
      const partial = period.kind === 'night' ? 'Night only' : 'Day only';
      groups.push({key: period.key, periods: [period], partial});
    }
  }
  return groups;
}

/** The periods the issuance forecasts precipitation for. */
export function precipPeriods(issuance: NWACWeatherIssuance): NWACWeatherPeriod[] {
  return issuance.periods.filter(p => p.precip);
}

/** The 6h blocks with a value for any zone, else the whole window; the wire doesn't say. */
export function blocksWithData<Cell>(issuance: NWACWeatherIssuance, grid: NWACWeatherGrid<Cell>, hasValue: (cell: Cell) => boolean): NWACWeatherBlock[] {
  const used = new Set<string>();
  for (const cells of Object.values(grid)) {
    for (const [key, cell] of Object.entries(cells)) if (hasValue(cell)) used.add(key);
  }
  const shown = issuance.blocks.filter(b => used.has(b.key));
  return shown.length ? shown : issuance.blocks;
}

export function windBlocks(issuance: NWACWeatherIssuance): NWACWeatherBlock[] {
  return blocksWithData(issuance, issuance.wind, c => c.speed != null);
}

export function snowLevelBlocks(issuance: NWACWeatherIssuance): NWACWeatherBlock[] {
  return blocksWithData(issuance, issuance.snowLevel, c => c.freezing != null);
}

/** The periods a 12h table shows: those with a value for any zone, else the whole window. */
export function tempPeriods(issuance: NWACWeatherIssuance): NWACWeatherPeriod[] {
  const used = new Set<string>();
  for (const cells of Object.values(issuance.temp)) {
    for (const [key, cell] of Object.entries(cells)) if (cell.high != null) used.add(key);
  }
  const shown = issuance.periods.filter(p => used.has(p.key));
  return shown.length ? shown : issuance.periods;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mon Sep 14" for a `YYYY-MM-DD` calendar date. */
export function fmtCalendarDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return ymd;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`;
}

const SENSIBLE_SLOTS = [
  {key: 'morning', label: 'Today / Tonight'},
  {key: 'afternoon', label: 'Tomorrow'},
] as const;

/**
 * The sensible-weather days an issuance writes, each with its label and date (null when the
 * issuance has none for it). An afternoon issuance's first date is only its night, so its first
 * day reads "Tonight".
 */
export function sensibleSlots(issuance: NWACWeatherIssuance) {
  const dates = periodDateGroups(issuance.periods);
  const firstIsNight = dates.length > 0 && issuance.periods.filter(p => p.date === dates[0].date).every(p => p.kind === 'night');
  return SENSIBLE_SLOTS.map((s, i) => ({
    key: s.key,
    label: i === 0 && firstIsNight ? 'Tonight' : s.label,
    date: dates[i]?.date ?? null,
  }));
}

export function issuanceLabel(type: NWACWeatherIssuance['type']): string {
  return type === 'morning' ? 'Morning Forecast' : 'Afternoon Forecast';
}

/** An issuance's time of day ("2:30 PM") in the center's timezone; null for a bad timestamp. */
export function issueTime(iso: string, timezone: string | null | undefined): string | null {
  return isNaN(new Date(iso).getTime()) ? null : formatDateTime(iso, timezone, 'h:mm a');
}

export function issuanceShortLabel(type: NWACWeatherIssuance['type']): string {
  return type === 'morning' ? 'Morning' : 'Afternoon';
}

/** Periods grouped by calendar date, for the By Zone header. */
export function periodDateGroups(periods: NWACWeatherPeriod[]): {date: string; span: number}[] {
  const out: {date: string; span: number}[] = [];
  for (const p of periods) {
    const last = out[out.length - 1];
    if (last && last.date === p.date) last.span++;
    else out.push({date: p.date, span: 1});
  }
  return out;
}

/** The date a 6h block falls on, via its parent period. */
export function blockDate(issuance: NWACWeatherIssuance, block: NWACWeatherBlock): string | null {
  return issuance.periods.find(p => p.key === block.period)?.date ?? null;
}

/** How far either side of the rounded amount a snow range reaches, widening with the amount. */
function snowHalfWidth(snow: number): number {
  if (snow < 6.5) return 1;
  if (snow < 14.5) return 2;
  if (snow < 19.5) return 3;
  if (snow < 24.5) return 4;
  if (snow < 33.5) return 5;
  return 6;
}

/**
 * The public reads snow as a range, never the exact derived amount, per the forecasters' table:
 * T for a trace, then a range centred on the whole inch that widens with the amount (3.0 → 2–4").
 */
export function snowRange(snow: number | null | undefined): string {
  if (snow == null || !Number.isFinite(snow)) return DASH;
  const tenths = Math.round(snow * 10) / 10;
  if (tenths <= 0) return '0';
  if (tenths <= 0.7) return 'T–1"';
  if (tenths <= 1.4) return '0.5–2"';
  if (tenths > 40) return '36–50"';
  const mid = Math.round(tenths);
  const half = snowHalfWidth(tenths);
  return `${mid - half}–${mid + half}"`;
}

/**
 * Which of four shading steps a snow amount's range falls in, on the same tenths `snowRange` reads
 * (trace to 1.4", to 6.4", to 14.4", then more); null for none or not forecast.
 */
export const SNOW_TIER_LABELS = ['T–2"', '1–7"', '5–16"', '12"+'];
export function snowTier(snow: number | null | undefined): number | null {
  if (snow == null || !Number.isFinite(snow)) return null;
  const tenths = Math.round(snow * 10) / 10;
  if (tenths <= 0) return null;
  if (tenths < 1.5) return 0;
  if (tenths < 6.5) return 1;
  if (tenths < 14.5) return 2;
  return 3;
}

/** One point's snow for one period, from its water amount and ratio. */
export function pointSnow(issuance: NWACWeatherIssuance, pointCode: string, periodKey: string): number | null {
  const cell = issuance.precip[pointCode]?.[periodKey];
  return deriveSnow(cell?.qpf, cell?.slr);
}

/** The points that forecast a zone's snow, in the issuance's order. */
export function zonePoints(issuance: NWACWeatherIssuance, zoneId: string) {
  return issuance.points.filter(p => p.zoneId === zoneId);
}

export function zoneSnow(issuance: NWACWeatherIssuance, zoneId: string, periodKey: string): number | null {
  const snows = zonePoints(issuance, zoneId)
    .map(p => pointSnow(issuance, p.code, periodKey))
    .filter((s): s is number => s != null);
  if (snows.length === 0) return null;
  return Math.round((snows.reduce((a, b) => a + b, 0) / snows.length) * 10) / 10;
}

/** The zones an issuance measured, narrowed to one avalanche zone when the page has one. */
export function zonesFor(issuance: NWACWeatherIssuance, avalancheZoneId?: number | null) {
  if (avalancheZoneId == null) return issuance.zones;
  const match = issuance.zones.filter(z => z.avalancheZoneId === avalancheZoneId);
  return match;
}
