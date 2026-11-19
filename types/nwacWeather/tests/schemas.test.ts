import {nwacWeatherZoneResponseSchema} from 'types/nwacWeather/schemas';
import fixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';

describe('nwacWeatherZoneResponseSchema', () => {
  it('parses a route response with one issuance', () => {
    const result = nwacWeatherZoneResponseSchema.parse(fixture.afternoon);
    expect(result.day?.issuances).toHaveLength(1);
    expect(result.day?.issuances[0].type).toEqual('afternoon');
  });

  it('keeps the 24-hour windows read from the issuances', () => {
    const result = nwacWeatherZoneResponseSchema.parse(fixture.afternoon);
    expect(result.day?.windows).toEqual([
      {startsAt: '2026-09-15T01:00:00.000Z', issuance: 0, periodKeys: ['n1', 'd2']},
      {startsAt: '2026-09-15T13:00:00.000Z', issuance: 0, periodKeys: ['d2', 'n2']},
    ]);
  });

  it('keeps a past forecast held to its 24 hours', () => {
    const windows = [{startsAt: '2026-09-15T01:00:00.000Z', issuance: 0, periodKeys: ['n1', 'd2'], held: true}];
    const result = nwacWeatherZoneResponseSchema.parse({day: {...fixture.afternoon.day, windows}});
    expect(result.day?.windows[0].held).toBe(true);
  });

  it('rejects a day without windows', () => {
    const {windows: _windows, ...day} = fixture.afternoon.day;
    expect(nwacWeatherZoneResponseSchema.safeParse({day}).success).toBe(false);
  });

  it('parses a response with no forecast', () => {
    expect(nwacWeatherZoneResponseSchema.parse({day: null})).toEqual({day: null});
  });

  it('rejects the old Tastypie envelope', () => {
    expect(nwacWeatherZoneResponseSchema.safeParse({meta: {}, objects: {}}).success).toBe(false);
  });

  it('rejects an issuance with an unknown type', () => {
    const issuance = {...fixture.afternoon.day.issuances[0], type: 'evening'};
    const response = {day: {...fixture.afternoon.day, issuances: [issuance]}};
    expect(nwacWeatherZoneResponseSchema.safeParse(response).success).toBe(false);
  });
});
