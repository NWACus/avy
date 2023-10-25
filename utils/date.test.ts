import {toDate} from 'date-fns-tz';
import * as TimezoneMock from 'timezone-mock';
import {
  apiDateString,
  nominalForecastDateString,
  nominalNWACWeatherForecastDate,
  normalizeTimeZone,
  startOfSeasonLocalDate,
  utcDateToLocalDateString,
  utcDateToLocalTimeString,
} from 'utils/date';

describe('Dates', () => {
  describe('apiDateString', () => {
    it('renders into the expected format', () => {
      // This is 2AM UTC, which means it's 6PM the night before in PST
      // https://github.com/stevekuznetsov/avalanche-forecast/issues/42 was caused by getting 2023-01-18 for the result of this function
      const d = new Date('2023-01-19T02:00:00Z');
      expect(apiDateString(d)).toEqual('2023-01-19');
    });

    it('throws a useful error when given an invalid date', () => {
      expect(() => apiDateString(new Date('2023-01-32'))).toThrow('Failed to format date: Invalid time value, Invalid Date, yyyy-MM-dd, UTC');
    });
  });

  describe('utcDateToLocalTimeString', () => {
    const dateString = '2023-01-19T02:01:02Z';
    const date = new Date(dateString);

    it('renders correctly in Pacific time', () => {
      TimezoneMock.register('US/Pacific');
      expect(utcDateToLocalTimeString(date)).toEqual('Wed, Jan 18, 2023 6:01 PM');
    });

    it('renders correctly in Australian time', () => {
      TimezoneMock.register('Australia/Adelaide');
      expect(utcDateToLocalTimeString(date)).toEqual('Thu, Jan 19, 2023 12:31 PM');
    });

    it('accepts strings as well as Dates', () => {
      TimezoneMock.register('Australia/Adelaide');
      expect(utcDateToLocalTimeString(dateString)).toEqual('Thu, Jan 19, 2023 12:31 PM');
    });

    it('returns Unknown for null/undefined', () => {
      expect(utcDateToLocalTimeString(null)).toEqual('Unknown');
      expect(utcDateToLocalTimeString(undefined)).toEqual('Unknown');
    });

    afterEach(() => {
      TimezoneMock.unregister();
    });
  });

  describe('utcDateToLocalDateString', () => {
    const dateString = '2023-01-19T02:01:02Z';
    const date = new Date(dateString);

    it('renders correctly in Pacific time', () => {
      TimezoneMock.register('US/Pacific');
      expect(utcDateToLocalDateString(date)).toEqual('Wednesday, January 18, 2023');
    });

    it('renders correctly in Australian time', () => {
      TimezoneMock.register('Australia/Adelaide');
      expect(utcDateToLocalDateString(date)).toEqual('Thursday, January 19, 2023');
    });

    it('accepts strings as well as Dates', () => {
      TimezoneMock.register('Australia/Adelaide');
      expect(utcDateToLocalDateString(dateString)).toEqual('Thursday, January 19, 2023');
    });

    it('returns Unknown for null/undefined', () => {
      expect(utcDateToLocalDateString(null)).toEqual('Unknown');
      expect(utcDateToLocalDateString(undefined)).toEqual('Unknown');
    });

    afterEach(() => {
      TimezoneMock.unregister();
    });
  });

  describe('nominalForecastDate', () => {
    it('returns the current day when requesting before the expiry time', () => {
      expect(nominalForecastDateString(new Date('2023-01-24T09:44:27-08:00'), 'America/Los_Angeles', 18)).toBe('2023-01-24');
    });
    it('returns the next day when requesting after the expiry time', () => {
      expect(nominalForecastDateString(new Date('2023-01-24T19:44:27-08:00'), 'America/Los_Angeles', 18)).toBe('2023-01-25');
    });
    it('returns the current day when requesting before the expiry time using UTC', () => {
      expect(nominalForecastDateString(new Date('2023-01-24T17:44:27-00:00'), 'America/Los_Angeles', 18)).toBe('2023-01-24');
    });
    it('returns the next day when requesting after the expiry time using UTC', () => {
      expect(nominalForecastDateString(new Date('2023-01-25T03:44:27-00:00'), 'America/Los_Angeles', 18)).toBe('2023-01-25');
    });
    it('handles single-digit expiry hours', () => {
      expect(nominalForecastDateString(new Date('2023-01-24T19:44:27-08:00'), 'America/Los_Angeles', 1)).toBe('2023-01-25');
    });
  });

  describe('nominalNWACWeatherForecastDate', () => {
    it('returns the current day morning when requesting before the expiry time', () => {
      expect(nominalNWACWeatherForecastDate(new Date('2023-01-24T09:44:27-08:00'))).toBe('2023-01-24 morning');
    });
    it('returns the current day afternoon when requesting after the expiry time', () => {
      expect(nominalNWACWeatherForecastDate(new Date('2023-01-24T19:44:27-08:00'))).toBe('2023-01-24 afternoon');
    });
    it('returns the current day morning when requesting before the expiry time using UTC', () => {
      expect(nominalNWACWeatherForecastDate(new Date('2023-01-24T17:44:27-00:00'))).toBe('2023-01-24 morning');
    });
    it('returns the current day afternoon when requesting after the expiry time using UTC', () => {
      expect(nominalNWACWeatherForecastDate(new Date('2023-01-25T03:44:27-00:00'))).toBe('2023-01-24 afternoon');
    });
  });

  describe('startOfSeasonLocalDate', () => {
    const localDate = (dateString: string): Date => {
      return toDate(dateString, {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
    };
    it('returns September 1 of the current year when date is after september 1', () => {
      expect(startOfSeasonLocalDate(localDate('2023-10-01'))).toEqual(localDate('2023-09-01'));
    });
    it('returns September 1 of the previous year when date is before august 31', () => {
      expect(startOfSeasonLocalDate(localDate('2023-01-01'))).toEqual(localDate('2022-09-01'));
    });
    it('returns September 1 of the previous year when date is august 31', () => {
      expect(startOfSeasonLocalDate(localDate('2023-08-31'))).toEqual(localDate('2022-09-01'));
    });
    it('returns September 1 of the current year when date is september 31', () => {
      expect(startOfSeasonLocalDate(localDate('2023-09-01'))).toEqual(localDate('2023-09-01'));
    });
  });

  describe('normalizeTimeZone', () => {
    it('returns the iana timezone when given a valid timezone', () => {
      expect(normalizeTimeZone('America/Los_Angeles')).toEqual({ianaName: 'America/Los_Angeles', abbreviation: null});
    });

    it('returns the iana timezone when an abbreviation used in north america', () => {
      expect(normalizeTimeZone('PST')).toEqual({ianaName: 'America/Los_Angeles', abbreviation: 'PST'});
      expect(normalizeTimeZone('PDT')).toEqual({ianaName: 'America/Los_Angeles', abbreviation: 'PDT'});

      expect(normalizeTimeZone('AKST')).toEqual({ianaName: 'America/Anchorage', abbreviation: 'AKST'});
      expect(normalizeTimeZone('AKDT')).toEqual({ianaName: 'America/Anchorage', abbreviation: 'AKDT'});

      expect(normalizeTimeZone('MST')).toEqual({ianaName: 'America/Denver', abbreviation: 'MST'});
      expect(normalizeTimeZone('MDT')).toEqual({ianaName: 'America/Denver', abbreviation: 'MDT'});
    });

    it('treats abbreviations as case-insensitive', () => {
      expect(normalizeTimeZone('PsT')).toEqual({ianaName: 'America/Los_Angeles', abbreviation: 'PST'});
      expect(normalizeTimeZone('pDt')).toEqual({ianaName: 'America/Los_Angeles', abbreviation: 'PDT'});
    });

    it('does not validate the IANA timezone name', () => {
      expect(normalizeTimeZone('foo/bar')).toEqual({ianaName: 'foo/bar', abbreviation: null});
    });
  });
});
