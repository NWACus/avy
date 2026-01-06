import {add, isAfter} from 'date-fns';
import {format, formatInTimeZone as formatInTimeZoneDateFnsTz, toDate} from 'date-fns-tz';

// Snowbound returns time zone abbreviations, but we need IANA timezone names, especially on Android
// where Intl support is a pile of 💩
const timeZoneMapping: Record<string, string> = {
  AKST: 'America/Anchorage',
  AKDT: 'America/Anchorage',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  EST: 'America/New_York',
  EDT: 'America/New_York',
} as const;

interface NormalizedTimeZone {
  abbreviation: string | null;
  ianaName: string;
}

export function normalizeTimeZone(input: string): NormalizedTimeZone {
  const abbreviation = timeZoneMapping[input.toUpperCase()] ? input.toUpperCase() : null;
  const ianaName = timeZoneMapping[input.toUpperCase()] || input;
  return {abbreviation, ianaName};
}

export const formatInTimeZone = (date: string | number | Date, timeZone: string, formatString: string) => {
  const normalizedTimeZone = normalizeTimeZone(timeZone);
  try {
    return formatInTimeZoneDateFnsTz(date, normalizedTimeZone.ianaName, formatString);
  } catch (e: unknown) {
    throw new Error(`Failed to format date: ${(e as Error).message}, ${date.toString()}, ${formatString}, ${timeZone}, ${normalizedTimeZone.ianaName}`, {cause: e});
  }
};

export const toISOStringUTC = (date: Date) => formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ssXXX');

export const toDateTimeInterfaceATOM = (date: Date) => formatInTimeZone(date, 'UTC', "yyyy-MM-dd'T'HH:mm:ssXXX");

// The National Avalanche Center API expects 'YYYY-MM-DD' date-strings in query parameters, and it operates in UTC.
export const apiDateString = (date: Date) => formatInTimeZone(date, 'UTC', 'yyyy-MM-dd');
export const toSnowboundStringUTC = (date: Date) => formatInTimeZone(date, 'UTC', 'yyyyMMddHHmm');

// Forecasts expire in the middle of a calendar day, so the forecast that we expect to be valid at any given time during
// the day changes based on the relationship of that time to the expected expiry time, as recorded for the avalanche
// center. For example:
// | requestedTime | expiryTimeHours | nominalForecastDate |
// | ------------- | --------------- | ------------------- |
// |  01/01 09:00  |   18 (hours)    |  01/01              |
// |  01/01 18:00  |   18 (hours)    |  01/02              |
// |  01/01 20:00  |   18 (hours)    |  01/02              |
export const nominalForecastDate = (requestedTime: Date, expiryTimeZone: string, expiryTimeHours: number): Date => {
  // requestedTime is in UTC, expiryTimeHours is relative to the locale-specific start of day
  const normalizedExpiryTimeZone = normalizeTimeZone(expiryTimeZone);
  const expiryTimeString = `${formatInTimeZone(requestedTime, normalizedExpiryTimeZone.ianaName, 'yyyy-MM-dd')} ${String(expiryTimeHours).padStart(2, '0')}:00:00`;
  const expiryTime = toDate(expiryTimeString, {timeZone: normalizedExpiryTimeZone.ianaName});
  if (isAfter(expiryTime, requestedTime)) {
    return requestedTime;
  } else {
    const tomorrow = add(requestedTime, {days: 1});
    return tomorrow;
  }
};

export const nominalForecastDateString = (requestedTime: Date, expiryTimeZone: string, expiryTimeHours: number): string => {
  return formatInTimeZone(nominalForecastDate(requestedTime, expiryTimeZone, expiryTimeHours), expiryTimeZone, 'yyyy-MM-dd');
};

// NWAC aims to publish weather forecasts at 7a and 2p Pacific Time, daily. Expire halfway between that.
export const nominalNWACWeatherForecastDate = (requestedTime: Date): string => {
  const expiryTimeZone = 'America/Los_Angeles';
  const expiryTimeHours = 10;
  // requestedTime is in UTC, expiryTimeHours is relative to the locale-specific start of day
  const expiryTimeString = `${formatInTimeZone(requestedTime, expiryTimeZone, 'yyyy-MM-dd')} ${String(expiryTimeHours).padStart(2, '0')}:00:00`;
  const expiryTime = toDate(expiryTimeString, {timeZone: expiryTimeZone});
  if (isAfter(expiryTime, requestedTime)) {
    return `${formatInTimeZone(requestedTime, expiryTimeZone, 'yyyy-MM-dd')} morning`;
  } else {
    return `${formatInTimeZone(requestedTime, expiryTimeZone, 'yyyy-MM-dd')} afternoon`;
  }
};

export const utcDateToLocalTimeString = (date: Date | string | undefined | null): string => {
  if (date == null) {
    return 'Unknown';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, `EEE, MMM d, yyyy \nh:mm a`);
};

export const utcDateToLocalDateString = (date: Date | string | undefined | null): string => {
  if (date == null) {
    return 'Unknown';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, `EEEE, MMMM d, yyyy`);
};

export const utcDateToLocalShortDateString = (date: Date | string | undefined | null): string => {
  if (date == null) {
    return 'Unknown';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, `MMM d, yyyy`);
};

// This is used when dealing with observation start dates. These dates are given to us with no time zone or timestamp.
// By setting the time zone to Anchorage, we're creating a buffer for the user so that localized date for the user anywhere east of Anchorage will show the same day.
// The issue with setting it to Pacific time is that when toDate() is called, the Date object is set to midnight in the given time zone. That means that users in
// Alaska see the date as 1 day before the original date after localization is done because they're 1 hour behind.
export const observationStartDateToLocalShortDateString = (date: Date | string | undefined | null): string => {
  if (date == null) {
    return 'Unknown';
  }
  const d = typeof date === 'string' ? toDate(date, {timeZone: 'America/Anchorage'}) : date;
  return format(d, `MMM d, yyyy`);
};

// This is used when dealing with observation start dates. These dates are given to us with no time zone or timestamp.
// By setting the time zone to Anchorage, we're creating a buffer for the user so that localized date for the user anywhere east of Anchorage will show the same day.
// The issue with setting it to Pacific time is that when toDate() is called, the Date object is set to midnight in the given time zone. That means that users in
// Alaska see the date as 1 day before the original date after localization is done because they're 1 hour behind.
export const observationStartDateToLocalDateString = (date: Date | string | undefined | null): string => {
  if (date == null) {
    return 'Unknown';
  }

  const d = typeof date === 'string' ? toDate(date, {timeZone: 'America/Anchorage'}) : date;
  return format(d, `EEEE, MMMM d, yyyy`);
};

export const pacificDateToDayOfWeekString = (date: Date | string | undefined | null): string => {
  if (date == null) {
    return 'Unknown';
  }
  const d = typeof date === 'string' ? toDate(date, {timeZone: 'America/Los_Angeles'}) : date;
  return format(d, `EEEE`);
};

// Due to the structure of the NAC API, we are forced to use two different fetching paradigms for data -
// either we're looking for the latest data we can get, or we need something from the past. When we are fetching
// the latest data, we still record the time at which we're asking to allow us to be more efficient with the
// cache during forecast cut-over times. When we're fetching a previous forecast, we normalize the date to ensure that
// we can cache a request for e.g. 01-01-2001 01:00:00 the same as 01-01-2001 02:00:00, since those will net the
// same result.
export type RequestedTime = Date | 'latest';

// "latest" is a special string to mean Date.now()
export type RequestedTimeString = string;
export const requestedTimeToUTCDate = (requestedTime: RequestedTime): Date => {
  if (requestedTime !== 'latest') {
    return toDate(new Date(requestedTime), {timeZone: 'UTC'});
  }

  return toDate(new Date(), {timeZone: 'UTC'});
};

export const formatRequestedTime = (requestedTime: RequestedTime): RequestedTimeString => {
  if (requestedTime !== 'latest') {
    return toISOStringUTC(requestedTime);
  }

  return 'latest';
};

export const parseRequestedTimeString = (requestedTime: RequestedTimeString): RequestedTime => {
  if (requestedTime !== 'latest') {
    return toDate(requestedTime, {timeZone: 'UTC'});
  }

  return 'latest';
};
