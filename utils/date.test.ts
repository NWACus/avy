import {apiDateString, fixMalformedISO8601DateString, nominalForecastDate, utcDateToLocalDateString, utcDateToLocalTimeString} from 'utils/date';
import * as TimezoneMock from 'timezone-mock';

describe('Dates', () => {
  describe('fixMalformedISO8601DateString', () => {
    it('adds a UTC signifier if no timezone information is present', () => {
      expect(fixMalformedISO8601DateString('2023-01-19T02:00:00')).toEqual('2023-01-19T02:00:00Z');
      expect(fixMalformedISO8601DateString('2023-01-19T02:00:00.123')).toEqual('2023-01-19T02:00:00.123Z');
    });

    it('does not modify the string if not needed', () => {
      expect(fixMalformedISO8601DateString('2023-01-19')).toEqual('2023-01-19');
      expect(fixMalformedISO8601DateString('2023-01-19T02:00:00Z')).toEqual('2023-01-19T02:00:00Z');
      expect(fixMalformedISO8601DateString('2023-01-19T02:00:00+00')).toEqual('2023-01-19T02:00:00+00');
      expect(fixMalformedISO8601DateString('2023-01-19T02:00:00+00:00')).toEqual('2023-01-19T02:00:00+00:00');
      expect(fixMalformedISO8601DateString('2023-01-19T02:00:00.123+00:00')).toEqual('2023-01-19T02:00:00.123+00:00');
    });
  });
  describe('apiDateString', () => {
    it('renders into the expected format', () => {
      // This is 2AM UTC, which means it's 6PM the night before in PST
      // https://github.com/stevekuznetsov/avalanche-forecast/issues/42 was caused by getting 2023-01-18 for the result of this function
      const d = new Date('2023-01-19T02:00:00Z');
      expect(apiDateString(d)).toEqual('2023-01-19');
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
      expect(nominalForecastDate(new Date('2023-01-24T09:44:27-08:00'), 'America/Los_Angeles', 18)).toBe('2023-01-24');
    });
    it('returns the next day when requesting after the expiry time', () => {
      expect(nominalForecastDate(new Date('2023-01-24T19:44:27-08:00'), 'America/Los_Angeles', 18)).toBe('2023-01-25');
    });
    it('returns the current day when requesting before the expiry time using UTC', () => {
      expect(nominalForecastDate(new Date('2023-01-24T17:44:27-00:00'), 'America/Los_Angeles', 18)).toBe('2023-01-24');
    });
    it('returns the next day when requesting after the expiry time using UTC', () => {
      expect(nominalForecastDate(new Date('2023-01-25T03:44:27-00:00'), 'America/Los_Angeles', 18)).toBe('2023-01-25');
    });
    it('handles single-digit expiry hours', () => {
      expect(nominalForecastDate(new Date('2023-01-24T19:44:27-08:00'), 'America/Los_Angeles', 1)).toBe('2023-01-25');
    });
  });
});
