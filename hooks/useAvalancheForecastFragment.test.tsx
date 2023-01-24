// useAvalancheForecastFragments pulls in Sentry, which makes Jest blow up
jest.mock('@sentry/react-native', () => ({init: () => jest.fn()}));

import axios from 'axios';
import {renderHook} from '@testing-library/react-hooks';

import {isBetween, useAvalancheForecastFragment} from 'hooks/useAvalancheForecastFragment';
import {QueryClient, QueryClientProvider} from 'react-query';

import testdata from './__testdata__';

// Mock out all top level functions, such as get, put, delete and post:
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useAvalancheForecastFragment', () => {
  it('we should select a forecast created 2 days before but still valid on the current day', async () => {
    // This test verifies the fix for https://github.com/stevekuznetsov/avalanche-forecast/issues/91
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          cacheTime: 0,
          staleTime: 0,
          retry: false,
        },
      },
    });
    const wrapper = ({children}) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

    mockedAxios.get.mockResolvedValue({data: testdata.forecastCreated2DaysAgo});

    const {result, waitForNextUpdate} = renderHook(() => useAvalancheForecastFragment('NWAC', 1139, new Date('2023-01-24Z'), {skipCacheForTests: true}), {wrapper});
    await waitForNextUpdate();
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data.id).toBe(117888);
    expect(result.current.data.forecast_zone[0].name).toBe('East Slopes South');
  });

  describe('isBetween', () => {
    // this represents an interval between midnight of the given day and midnight of the next day
    const today = new Date('2023-01-20Z');

    it('returns true for a forecast published later in the given day', () => {
      const publishedDate = new Date('2023-01-20T02:00:00.000Z');
      const expiresDate = new Date('2023-01-21T02:00:00.000Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(true);
    });

    it('returns true for a forecast published in the middle of the given day', () => {
      const publishedDate = new Date('2023-01-20T02:00:00.000Z');
      const expiresDate = new Date('2023-01-20T08:00:00.000Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(true);
    });

    it('returns true for a forecast expiring later in the given day', () => {
      const publishedDate = new Date('2023-01-19T02:00:00.000Z');
      const expiresDate = new Date('2023-01-20T02:00:00.000Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(true);
    });

    it('returns false for a forecast expiring before the given day', () => {
      const publishedDate = new Date('2023-01-19T02:00:00.000Z');
      const expiresDate = new Date('2023-01-19T23:59:59.999Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(false);
    });

    it('returns false for a forecast published after the given day', () => {
      const publishedDate = new Date('2023-01-23Z');
      const expiresDate = new Date('2023-01-24Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(false);
    });
  });
});
