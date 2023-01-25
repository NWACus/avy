import {fetchWeather} from 'components/forecast/useNWACWeatherForecast';

describe('useNWACWeatherForecast', () => {
  // Off by default; not sure we want to let this constantly hit the server
  it.skip('scrapes the HTML into a reasonable format', async () => {
    const data = await fetchWeather();

    expect(data.author).not.toBeNull();
    expect(data.synopsis).not.toBeNull();
    expect(data.zones['Olympics']).not.toBeNull();
    expect(data.zones['Olympics'][0].forecast).not.toBeNull();
  });
});
