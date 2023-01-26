import {fetchWeather} from './useWeatherForecasts';

// Tests are skipped by default; not sure we want to let this constantly hit the server
describe.skip('useNWACWeatherForecast', () => {
  it('scrapes the HTML into a reasonable format', async () => {
    const data = await fetchWeather();

    expect(data.author).not.toBeNull();
    expect(data.synopsis).not.toBeNull();
    expect(data.zones['Olympics']).not.toBeNull();
    expect(data.zones['Olympics'][0].forecast).not.toBeNull();
  });

  it('maps zone names as needed', async () => {
    const data = await fetchWeather();

    expect(data.zones['East Slopes Central']).toBeDefined();
    expect(data.zones['East Slopes North']).toBeDefined();
    expect(data.zones['East Slopes South']).toBeDefined();
    expect(data.zones['Mt Hood']).toBeDefined();
    expect(data.zones['Olympics']).toBeDefined();
    expect(data.zones['Snoqualmie Pass']).toBeDefined();
    expect(data.zones['Stevens Pass']).toBeDefined();
    expect(data.zones['West Slopes Central']).toBeDefined();
    expect(data.zones['West Slopes North']).toBeDefined();
    expect(data.zones['West Slopes South']).toBeDefined();
  });

  it('every zone gets precipitation', async () => {
    const data = await fetchWeather();

    expect(data.zones['East Slopes Central'][0].precipitation).toBeDefined();
    expect(data.zones['East Slopes North'][0].precipitation).toBeDefined();
    expect(data.zones['East Slopes South'][0].precipitation).toBeDefined();
    expect(data.zones['Mt Hood'][0].precipitation).toBeDefined();
    expect(data.zones['Olympics'][0].precipitation).toBeDefined();
    expect(data.zones['Snoqualmie Pass'][0].precipitation).toBeDefined();
    expect(data.zones['Stevens Pass'][0].precipitation).toBeDefined();
    expect(data.zones['West Slopes Central'][0].precipitation).toBeDefined();
    expect(data.zones['West Slopes North'][0].precipitation).toBeDefined();
    expect(data.zones['West Slopes South'][0].precipitation).toBeDefined();
  });
});
