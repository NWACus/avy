import {add, format, isAfter} from 'date-fns';
import {formatInTimeZone, toDate} from 'date-fns-tz';

const MISSING_TIMEZONE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?$/;

// Some avalanche.org endpoints return dates without timezone information! This method is used to detect and fix them, by assuming they're UTC.
export const fixMalformedISO8601DateString = (date: string) => (MISSING_TIMEZONE.test(date) ? `${date}Z` : date);

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
export const nominalForecastDate = (requestedTime: Date, expiryTimeZone: string, expiryTimeHours: number): string => {
  // requestedTime is in UTC, expiryTimeHours is relative to the locale-specific start of day
  const expiryTimeString = `${formatInTimeZone(requestedTime, expiryTimeZone, 'yyyy-MM-dd')} ${String(expiryTimeHours).padStart(2, '0')}:00:00`;
  const expiryTime = toDate(expiryTimeString, {timeZone: expiryTimeZone});
  if (isAfter(expiryTime, requestedTime)) {
    return formatInTimeZone(requestedTime, expiryTimeZone, 'yyyy-MM-dd');
  } else {
    const tomorrow = add(requestedTime, {days: 1});
    return formatInTimeZone(tomorrow, expiryTimeZone, 'yyyy-MM-dd');
  }
};

export const utcDateToLocalTimeString = (date: Date | string | undefined): string => {
  if (date == null) {
    return 'Unknown';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, `EEE, MMM d, yyyy \nh:mm a`);
};

export const utcDateToLocalDateString = (date: Date | string | undefined): string => {
  if (date == null) {
    return 'Unknown';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, `EEEE, MMMM d, yyyy`);
};
