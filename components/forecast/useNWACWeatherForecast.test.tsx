import {fetchWeather} from 'components/forecast/useNWACWeatherForecast';

describe('test', () => {
  it('tests', async () => {
    const data = await fetchWeather();
  });
});
