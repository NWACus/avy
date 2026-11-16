import * as Sentry from '@sentry/react-native';
import axios from 'axios';
import {fetchNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {logger} from 'logger';
import fixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';
import {NotFoundError} from 'types/requests';
import {ZodError} from 'zod';

const HOST = 'https://nwac.example';
const OLYMPICS = 1645;

const respondWith = (data: unknown) => jest.spyOn(axios, 'get').mockResolvedValue({data});

describe('fetchNWACWeatherForecast', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests the zone route with the zone and published instant', async () => {
    const get = respondWith(fixture.afternoon);
    await fetchNWACWeatherForecast(HOST, OLYMPICS, new Date('2026-09-15T01:00:00.000Z'), logger);
    expect(get).toHaveBeenCalledWith(`${HOST}/api/nwac/nwac-weather-zone`, {
      params: {zone: OLYMPICS, published: '2026-09-15T01:00:00Z'},
    });
  });

  it('returns the day when the route has a forecast', async () => {
    respondWith(fixture.afternoon);
    const day = await fetchNWACWeatherForecast(HOST, OLYMPICS, new Date('2026-09-15T01:00:00Z'), logger);
    expect(day?.serviceDate).toEqual('2026-09-14');
    expect(day?.issuances.map(i => i.type)).toEqual(['afternoon']);
  });

  it('throws NotFoundError when the route has no forecast', async () => {
    respondWith({day: null});
    await expect(fetchNWACWeatherForecast(HOST, OLYMPICS, new Date('2026-09-15T01:00:00Z'), logger)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws and reports to Sentry on an unexpected shape', async () => {
    respondWith({meta: {}, objects: {}});
    await expect(fetchNWACWeatherForecast(HOST, OLYMPICS, new Date('2026-09-15T01:00:00Z'), logger)).rejects.toBeInstanceOf(ZodError);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
