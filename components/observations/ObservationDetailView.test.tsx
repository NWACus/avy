// This class pulls in Sentry, which makes Jest blow up
jest.mock('@sentry/react-native', () => ({init: () => jest.fn()}));

import {render, screen} from '@testing-library/react-native';

import {WeatherCard, withUnits} from 'components/observations/ObservationDetailView';
import {RenderHTMLConfigProvider, TRenderEngineProvider} from 'react-native-render-html';
import {CloudCover} from 'types/nationalAvalancheCenter';

describe('ObservationDetailView', () => {
  describe('WeatherCard', () => {
    describe('empty state', () => {
      it("renders null when advanced_fields isn't set", () => {
        render(<WeatherCard observation={{}} testID="card" />);
        expect(() => screen.getByTestId('card')).toThrowError(/Unable to find an element with testID: card/);
      });

      it('renders null when weather_summary and weather are missing', () => {
        render(<WeatherCard observation={{advanced_fields: {}}} testID="card" />);
        expect(() => screen.getByTestId('card')).toThrowError(/Unable to find an element with testID: card/);
      });

      it('renders null when weather_summary and weather are null', () => {
        render(<WeatherCard observation={{advanced_fields: {weather_summary: null, weather: null}}} testID="card" />);
        expect(() => screen.getByTestId('card')).toThrowError(/Unable to find an element with testID: card/);
      });

      it('renders null when weather_summary is "" and weather is null', () => {
        render(<WeatherCard observation={{advanced_fields: {weather_summary: '', weather: null}}} testID="card" />);
        expect(() => screen.getByTestId('card')).toThrowError(/Unable to find an element with testID: card/);
      });

      it('renders null when weather_summary is "" and weather is {}', () => {
        render(<WeatherCard observation={{advanced_fields: {weather_summary: '', weather: {}}}} testID="card" />);
        expect(() => screen.getByTestId('card')).toThrowError(/Unable to find an element with testID: card/);
      });

      it('renders null when weather_summary is "" and weather is {cloud_cover: ""}', () => {
        render(<WeatherCard observation={{advanced_fields: {weather_summary: '', weather: {cloud_cover: ''}}}} testID="card" />);
        expect(() => screen.getByTestId('card')).toThrowError(/Unable to find an element with testID: card/);
      });
    });

    describe('normal state', () => {
      it('renders summary when weather summary set', () => {
        // When rendering HTML content, we need TRenderEngineProvider & RenderHTMLConfigProvider in the tree
        render(
          <TRenderEngineProvider>
            <RenderHTMLConfigProvider>
              <WeatherCard observation={{advanced_fields: {weather_summary: '<p>it was cold</p>'}}} testID="card" />
            </RenderHTMLConfigProvider>
          </TRenderEngineProvider>,
        );

        expect(screen.queryByTestId('card')).not.toBeNull();
        expect(screen.queryByText('it was cold')).not.toBeNull();
      });

      it('renders cloud_cover when set', () => {
        render(
          <TRenderEngineProvider>
            <RenderHTMLConfigProvider>
              <WeatherCard observation={{advanced_fields: {weather: {cloud_cover: CloudCover.Scattered}, weather_summary: '<p>it was cold</p>'}}} testID="card" />
            </RenderHTMLConfigProvider>
          </TRenderEngineProvider>,
        );

        expect(screen.queryByTestId('card')).not.toBeNull();
        expect(screen.queryByText('Scattered')).not.toBeNull();
      });
    });
  });

  describe('withUnits', () => {
    it('appends units to numbers and strings that look like numbers', () => {
      expect(withUnits(2, 'light-years')).toEqual('2light-years');
      expect(withUnits('2', 'light-years')).toEqual('2light-years');
    });

    it('leaves strings alone, even partially numeric ones', () => {
      expect(withUnits('some', 'light-years')).toEqual('some');
      expect(withUnits("7800'", 'feet')).toEqual("7800'");
    });

    it('returns a default for missing/null values', () => {
      expect(withUnits(null, 'light-years')).toEqual('Unknown');
      expect(withUnits(undefined, 'light-years')).toEqual('Unknown');
    });
  });
});
