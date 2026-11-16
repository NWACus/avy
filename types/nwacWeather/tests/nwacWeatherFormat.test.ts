import {NWACWeatherIssuance} from 'types/nwacWeather/nwacWeather';
import {
  dayGroups,
  deriveSnow,
  fmtCalendarDate,
  fmtWind,
  issueTime,
  levelKind,
  sensibleSlots,
  snowRange,
  windBearing,
  windRange,
  windWording,
  zoneSnow,
  zonesFor,
} from 'types/nwacWeather/nwacWeatherFormat';
import {nwacWeatherZoneResponseSchema} from 'types/nwacWeather/schemas';
import fixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';

const OLYMPICS = 1645;

const issuanceOf = (response: unknown): NWACWeatherIssuance => {
  const day = nwacWeatherZoneResponseSchema.parse(response).day;
  if (!day) {
    throw new Error('fixture has no day');
  }
  return day.issuances[0];
};

const afternoon = issuanceOf(fixture.afternoon);
const morning = issuanceOf(fixture.morning);

describe('nwacWeatherFormat', () => {
  describe('snowRange', () => {
    it('reads amounts as the forecasters range', () => {
      expect(snowRange(null)).toEqual('—');
      expect(snowRange(0)).toEqual('0');
      expect(snowRange(0.5)).toEqual('T–1"');
      expect(snowRange(1)).toEqual('0.5–2"');
      expect(snowRange(2.6)).toEqual('2–4"');
      expect(snowRange(10)).toEqual('8–12"');
      expect(snowRange(45)).toEqual('36–50"');
    });
  });

  describe('deriveSnow', () => {
    it('derives snow from water and ratio, with dry and rain as 0', () => {
      expect(deriveSnow(0.24, 11)).toEqual(2.6);
      expect(deriveSnow(0, null)).toEqual(0);
      expect(deriveSnow(0.2, 0)).toEqual(0);
      expect(deriveSnow(null, 10)).toBeNull();
    });
  });

  describe('wind', () => {
    it('reads speeds as bands', () => {
      expect(windRange(25)).toEqual('20–30');
      expect(windWording(25)).toEqual('Moderate to Strong');
      expect(windRange(150)).toEqual('110+');
      expect(windRange(null)).toBeNull();
    });

    it('formats calm and missing wind', () => {
      expect(fmtWind({dir: 'W', speed: 3})).toEqual('W Calm');
      expect(fmtWind({dir: 'W', speed: 18})).toEqual('W 18');
      expect(fmtWind(undefined)).toEqual('—');
    });

    it('converts compass points to bearings', () => {
      expect(windBearing('N')).toEqual(0);
      expect(windBearing('wnw')).toEqual(292.5);
      expect(windBearing('VAR')).toBeNull();
      expect(windBearing(null)).toBeNull();
    });
  });

  describe('fmtCalendarDate', () => {
    it('formats a calendar date without shifting it by timezone', () => {
      expect(fmtCalendarDate('2026-09-14')).toEqual('Mon Sep 14');
    });
  });

  describe('issueTime', () => {
    it('formats the issue time in the center timezone', () => {
      expect(issueTime(afternoon.issuedAt, 'America/Los_Angeles')).toEqual('3:00 PM');
      expect(issueTime('not a date', 'America/Los_Angeles')).toBeNull();
    });
  });

  describe('with an issuance', () => {
    it('narrows zones to the avalanche zone', () => {
      expect(zonesFor(afternoon, OLYMPICS).map(z => z.id)).toEqual(['olympics']);
      expect(zonesFor(afternoon, 1)).toEqual([]);
    });

    it('averages a zone snow from its points', () => {
      expect(zoneSnow(afternoon, 'olympics', 'n1')).toEqual(2.6);
      expect(zoneSnow(afternoon, 'no-such-zone', 'n1')).toBeNull();
    });

    it('reads an auto level as snow when the period is wet', () => {
      expect(levelKind(afternoon, 'olympics', afternoon.blocks[0])).toEqual('snow');
      const dry = {...afternoon, precip: {}};
      expect(levelKind(dry, 'olympics', afternoon.blocks[0])).toEqual('freezing');
      const picked = {...dry, snowLevel: {olympics: {[afternoon.blocks[0].key]: {freezing: 5000, mode: 'snow'}}}};
      expect(levelKind(picked, 'olympics', afternoon.blocks[0])).toEqual('snow');
    });

    it('groups each night with the following day', () => {
      expect(dayGroups(afternoon.periods).map(g => [g.key, g.partial])).toEqual([
        ['n1-d2', null],
        ['n2-d3', null],
      ]);
      expect(dayGroups(morning.periods).map(g => [g.key, g.partial])).toEqual([
        ['d1', 'Day only'],
        ['n1-d2', null],
      ]);
    });

    it('labels sensible weather slots by issuance type', () => {
      expect(sensibleSlots(morning)).toEqual([
        {key: 'morning', label: 'Today / Tonight', date: '2026-09-14'},
        {key: 'afternoon', label: 'Tomorrow', date: '2026-09-15'},
      ]);
      expect(sensibleSlots(afternoon)).toEqual([
        {key: 'morning', label: 'Tonight', date: '2026-09-14'},
        {key: 'afternoon', label: 'Tomorrow', date: '2026-09-15'},
      ]);
    });
  });
});
