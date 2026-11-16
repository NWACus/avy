import {nwacWeatherZoneResponseSchema} from 'types/nwacWeather/schemas';
import fixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';

describe('nwacWeatherZoneResponseSchema', () => {
  it('parses a route response with one issuance', () => {
    const result = nwacWeatherZoneResponseSchema.parse(fixture.afternoon);
    expect(result.day?.issuances).toHaveLength(1);
    expect(result.day?.issuances[0].type).toEqual('afternoon');
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
