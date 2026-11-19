import {nwacWeatherPeriodViews, nwacWeatherWindowToShow} from 'components/forecast/WeatherTab/NWACWeatherTab';
import {NWACWeatherIssuance} from 'types/nwacWeather/nwacWeather';
import {nwacWeatherZoneResponseSchema} from 'types/nwacWeather/schemas';
import nwacWeatherFixture from 'types/nwacWeather/tests/fixtures/nwacWeatherZone.json';

describe('nwacWeatherWindowToShow', () => {
  const issuances = [{issuedAt: '2026-11-17T22:00:00+00:00'}, {issuedAt: '2026-11-18T22:00:00+00:00'}];
  const dayWindow = {startsAt: '2026-11-18T14:00:00.000Z', issuance: 0, periodKeys: ['d2', 'n2']};
  const nightWindow = {startsAt: '2026-11-19T02:00:00.000Z', issuance: 1, periodKeys: ['n1', 'd2']};

  it('shows the window started now while the newer issuance is not yet out', () => {
    expect(nwacWeatherWindowToShow([dayWindow, nightWindow], issuances, new Date('2026-11-18T20:00:00Z'))).toBe(dayWindow);
  });

  it('shows the newest issuance as soon as it is out, before its window starts', () => {
    expect(nwacWeatherWindowToShow([dayWindow, nightWindow], issuances, new Date('2026-11-19T00:30:00Z'))).toBe(nightWindow);
  });

  it('shows the window started now when one issuance covers both', () => {
    const sameIssuance = {...nightWindow, issuance: 0};
    expect(nwacWeatherWindowToShow([dayWindow, sameIssuance], issuances, new Date('2026-11-18T20:00:00Z'))).toBe(dayWindow);
    expect(nwacWeatherWindowToShow([dayWindow, sameIssuance], issuances, new Date('2026-11-19T03:00:00Z'))).toBe(sameIssuance);
  });

  it('falls back to the window started now when no issuance is out', () => {
    expect(nwacWeatherWindowToShow([dayWindow, nightWindow], issuances, new Date('2026-11-17T20:00:00Z'))).toBe(dayWindow);
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

  it('lays out only the periods on show, each with its 6h blocks', () => {
    const views = nwacWeatherPeriodViews(afternoon, 'olympics', ['n1', 'd2']);
    expect(views.map(view => [view.period.key, view.blocks.map(blockView => blockView.block.key)])).toEqual([
      ['n1', ['ev1', 'nt1']],
      ['d2', ['am2', 'pm2']],
    ]);
    expect(views[0].blocks[0]).toEqual({block: afternoon.blocks[0], level: 10000, snow: true, wind: {dir: 'W', speed: 15}, windOut: false});
    expect(views.some(view => view.tempOut)).toBe(false);
  });

  it('names the periods Tonight and Tomorrow, or a past forecast Night and Day', () => {
    expect(nwacWeatherPeriodViews(afternoon, 'olympics', ['n1', 'd2']).map(view => view.name)).toEqual(['Tonight', 'Tomorrow']);
    expect(nwacWeatherPeriodViews(afternoon, 'olympics', ['n1', 'd2'], true).map(view => view.name)).toEqual(['Night', 'Day']);
  });

  it("gives each period the forecaster's summary for its slot", () => {
    const views = nwacWeatherPeriodViews(afternoon, 'olympics', ['n1', 'd2']);
    expect(views.map(view => view.summary)).toEqual([afternoon.sensible.olympics.morning, afternoon.sensible.olympics.afternoon]);
    expect(nwacWeatherPeriodViews(afternoon, 'olympics', ['n2'])[0].summary).toBeNull();
  });

  it('marks temps past the forecast coverage', () => {
    const temp = {olympics: {n1: afternoon.temp.olympics.n1}};
    const views = nwacWeatherPeriodViews({...afternoon, temp}, 'olympics', ['n1', 'd2']);
    expect(views.map(view => view.tempOut)).toEqual([false, true]);
  });

  it('marks wind past the forecast coverage', () => {
    const wind = {olympics: {ev1: afternoon.wind.olympics.ev1, nt1: afternoon.wind.olympics.nt1, am2: afternoon.wind.olympics.am2}};
    const views = nwacWeatherPeriodViews({...afternoon, wind}, 'olympics', ['n1', 'd2']);
    expect(views.flatMap(view => view.blocks.map(blockView => blockView.windOut))).toEqual([false, false, false, true]);
  });
});
