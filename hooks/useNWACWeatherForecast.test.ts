import * as Sentry from '@sentry/react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderHook, waitFor} from '@testing-library/react-native';
import axios from 'axios';
import {productionHosts} from 'clientContext';
import {fetchNWACWeatherForecast, useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {logger} from 'logger';
import React, {PropsWithChildren} from 'react';
import fixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';
import {NotFoundError} from 'types/requests';
import {ZodError} from 'zod';

const HOST = 'https://nwac.example';
const OLYMPICS = 1645;
const AVALANCHE_FORECAST_PUBLISHED_TIME = '2026-09-14T22:30:00+00:00';

const respondWith = (data: unknown) => jest.spyOn(axios, 'get').mockResolvedValue({data});

describe('fetchNWACWeatherForecast', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the avalanche forecast published time unchanged as published', async () => {
    const get = respondWith(fixture.afternoon);
    await fetchNWACWeatherForecast(HOST, OLYMPICS, AVALANCHE_FORECAST_PUBLISHED_TIME, logger);
    expect(get).toHaveBeenCalledWith(`${HOST}/api/nwac/nwac-weather-zone`, {
      params: {zone: OLYMPICS, published: AVALANCHE_FORECAST_PUBLISHED_TIME},
    });
  });

  it('returns the day when the route has a forecast', async () => {
    respondWith(fixture.afternoon);
    const day = await fetchNWACWeatherForecast(HOST, OLYMPICS, AVALANCHE_FORECAST_PUBLISHED_TIME, logger);
    expect(day?.serviceDate).toEqual('2026-09-14');
    expect(day?.issuances.map(i => i.type)).toEqual(['afternoon']);
  });

  it('throws NotFoundError when the route has no forecast', async () => {
    respondWith({day: null});
    await expect(fetchNWACWeatherForecast(HOST, OLYMPICS, AVALANCHE_FORECAST_PUBLISHED_TIME, logger)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws and reports to Sentry on an unexpected shape', async () => {
    respondWith({meta: {}, objects: {}});
    await expect(fetchNWACWeatherForecast(HOST, OLYMPICS, AVALANCHE_FORECAST_PUBLISHED_TIME, logger)).rejects.toBeInstanceOf(ZodError);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

describe('useNWACWeatherForecast', () => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  const createWrapper = () => {
    const Wrapper: React.FC<PropsWithChildren> = ({children}) => React.createElement(QueryClientProvider, {client: queryClient}, children);
    return Wrapper;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    queryClient.clear();
  });

  it('does not request weather until the avalanche forecast published time is known', async () => {
    const get = respondWith(fixture.afternoon);
    const {result, rerender} = renderHook(({publishedTime}: {publishedTime: string | undefined}) => useNWACWeatherForecast(OLYMPICS, publishedTime), {
      wrapper: createWrapper(),
      initialProps: {publishedTime: undefined},
    });
    expect(result.current.fetchStatus).toEqual('idle');
    expect(get).not.toHaveBeenCalled();

    rerender({publishedTime: AVALANCHE_FORECAST_PUBLISHED_TIME});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(`${productionHosts.nwacHost}/api/nwac/nwac-weather-zone`, {
      params: {zone: OLYMPICS, published: AVALANCHE_FORECAST_PUBLISHED_TIME},
    });
  });
});
