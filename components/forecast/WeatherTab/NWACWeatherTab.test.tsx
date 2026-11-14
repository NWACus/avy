import {UseQueryResult} from '@tanstack/react-query';
import {render, screen} from '@testing-library/react-native';
import {NWACWeatherTab, nwacWeatherPeriodViews} from 'components/forecast/WeatherTab/NWACWeatherTab';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import React from 'react';
import {AvalancheForecastZone} from 'types/nationalAvalancheCenter';
import {NWACWeatherIssuance} from 'types/nwacWeather/nwacWeather';
import {nwacWeatherZoneResponseSchema} from 'types/nwacWeather/schemas';
import nwacWeatherFixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn()}),
  useFocusEffect: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('assets/illustrations/NoSearchResult.svg', () => ({__esModule: true, default: () => null}));
jest.mock('hooks/useAnalytics', () => ({useAnalytics: () => ({screen: jest.fn()})}));
jest.mock('hooks/useAvalancheCenterMetadata', () => ({useAvalancheCenterMetadata: jest.fn()}));
jest.mock('hooks/useAvalancheForecast', () => ({useAvalancheForecast: jest.fn()}));
jest.mock('hooks/useAllMapLayers', () => ({useAllMapLayers: jest.fn()}));
jest.mock('hooks/useWeatherStationsMetadata', () => ({useWeatherStationsMetadata: () => queryResult(undefined)}));
jest.mock('hooks/useNWACWeatherForecast', () => ({useNWACWeatherForecast: jest.fn()}));

const queryResult = <Result extends UseQueryResult<unknown, unknown>>(data: unknown): Result =>
  ({data, isLoading: data === undefined, isError: false, refetch: jest.fn()} as unknown as Result);

describe('NWACWeatherTab', () => {
  const zone = {id: 1645, name: 'Olympics'} as AvalancheForecastZone;

  beforeEach(() => {
    jest.mocked(useAvalancheCenterMetadata).mockReturnValue(queryResult({widget_config: {}}));
    jest.mocked(useAllMapLayers).mockReturnValue(queryResult({features: []}));
    jest.mocked(useNWACWeatherForecast).mockReturnValue(queryResult(undefined));
  });

  it('waits for the avalanche forecast before requesting weather', () => {
    jest.mocked(useAvalancheForecast).mockReturnValue(queryResult(undefined));
    render(<NWACWeatherTab zone={zone} center_id="NWAC" requestedTime="latest" />);
    expect(useNWACWeatherForecast).toHaveBeenLastCalledWith(zone.id, undefined);
    expect(screen.queryByText('Missing forecast')).toBeNull();
  });

  it('requests weather anchored on the avalanche forecast published time', () => {
    jest.mocked(useAvalancheForecast).mockReturnValue(queryResult({published_time: '2026-09-14T22:30:00+00:00'}));
    render(<NWACWeatherTab zone={zone} center_id="NWAC" requestedTime="latest" />);
    expect(useNWACWeatherForecast).toHaveBeenLastCalledWith(zone.id, '2026-09-14T22:30:00+00:00');
  });

  it('shows the missing forecast state when the avalanche forecast has no published time', () => {
    jest.mocked(useAvalancheForecast).mockReturnValue(queryResult({published_time: null}));
    render(<NWACWeatherTab zone={zone} center_id="NWAC" requestedTime="latest" />);
    expect(useNWACWeatherForecast).toHaveBeenLastCalledWith(zone.id, null);
    expect(screen.getByText('Missing forecast')).toBeTruthy();
  });
});

describe('nwacWeatherPeriodViews', () => {
  const issuanceOf = (response: unknown): NWACWeatherIssuance => {
    const day = nwacWeatherZoneResponseSchema.parse(response).day;
    if (!day) {
      throw new Error('fixture has no day');
    }
    return day.issuances[0];
  };
  const afternoon = issuanceOf(nwacWeatherFixture.afternoon);

  it('lays out each period with its 6h blocks', () => {
    const views = nwacWeatherPeriodViews(afternoon, 'olympics');
    expect(views.map(v => [v.period.key, v.blocks.map(b => b.block.key)])).toEqual([
      ['n1', ['ev1', 'nt1']],
      ['d2', ['am2', 'pm2']],
      ['n2', ['ev2', 'nt2']],
      ['d3', ['am3', 'pm3']],
    ]);
    expect(views[0].blocks[0]).toEqual({block: afternoon.blocks[0], level: 10000, snow: true, wind: {dir: 'W', speed: 15}});
    expect(views.some(v => v.tempOut)).toBe(false);
  });

  it('marks temps past the forecast coverage', () => {
    const temp = {olympics: {n1: afternoon.temp.olympics.n1, d2: afternoon.temp.olympics.d2}};
    const views = nwacWeatherPeriodViews({...afternoon, temp}, 'olympics');
    expect(views.map(v => v.tempOut)).toEqual([false, false, true, true]);
  });
});
