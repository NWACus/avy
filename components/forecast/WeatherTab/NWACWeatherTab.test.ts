import {nwacWeatherPeriodViews} from 'components/forecast/WeatherTab/NWACWeatherTab';
import {NWACWeatherIssuance} from 'types/nwacWeather/nwacWeather';
import {nwacWeatherZoneResponseSchema} from 'types/nwacWeather/schemas';
import nwacWeatherFixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';

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
