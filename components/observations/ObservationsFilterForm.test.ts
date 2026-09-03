import {ObservationFilterConfig, createDefaultFilterConfig, filtersForConfig, matchesFilters, matchesZone} from 'components/observations/ObservationsFilterForm';
import {DangerLevel, MapLayerFeature, ObservationFragment, ObservationZonesFeature, PartnerType, Position} from 'types/nationalAvalancheCenter';

const bboxRing = (west: number, east: number, south: number, north: number): Position[][] => [
  [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ],
];

const forecastZone = (id: number, name: string, west: number, east: number, south: number, north: number): MapLayerFeature => ({
  type: 'Feature',
  id,
  geometry: {type: 'Polygon', coordinates: bboxRing(west, east, south, north)},
  properties: {
    name,
    center_id: 'SNFAC',
    center_link: 'https://www.sawtoothavalanche.com/',
    state: 'ID',
    link: 'https://www.sawtoothavalanche.com/forecasts/avalanche/',
    off_season: true,
    travel_advice: '',
    danger: 'no rating',
    danger_level: DangerLevel.GeneralInformation,
    start_date: null,
    end_date: null,
    warning: {product: null},
    color: '#888888',
    stroke: '#104efb',
    font_color: '#ffffff',
    fillOpacity: 0.5,
    fillIncrement: 0.1,
  },
});

const alternateZone = (id: number, name: string, west: number, east: number, south: number, north: number): ObservationZonesFeature => ({
  type: 'Feature',
  id,
  geometry: {type: 'Polygon', coordinates: bboxRing(west, east, south, north)},
  properties: {name, center_id: 'SNFAC'},
});

// Deliberately non-overlapping boxes so that every fixture observation resolves to exactly one zone
const FORECAST_ZONES: MapLayerFeature[] = [forecastZone(1, 'Galena Summit', -115, -114, 43, 44), forecastZone(2, 'Banner Summit', -114, -113, 43, 44)];

const ALTERNATE_ZONES: ObservationZonesFeature[] = [alternateZone(-1, 'Boise Mountains', -117, -116, 43, 44), alternateZone(-2, 'Twin Falls Area', -113, -112, 41, 42)];

const observation = (id: string, lng: number, lat: number, observerType: PartnerType): ObservationFragment => ({
  id,
  observerType,
  name: id,
  startDate: '2026-01-15T12:00:00Z',
  locationPoint: {lng, lat},
  locationName: id,
  instability: {},
  observationSummary: '',
  media: [],
});

const GALENA = observation('galena', -114.5, 43.5, PartnerType.Forecaster);
const BANNER = observation('banner', -113.5, 43.5, PartnerType.Public);
const BOISE = observation('boise', -116.5, 43.5, PartnerType.Public);
const TWIN_FALLS = observation('twinFalls', -112.5, 41.5, PartnerType.Forecaster);
const NOWHERE = observation('nowhere', -100, 40, PartnerType.Public);

const OBSERVATIONS = [GALENA, BANNER, BOISE, TWIN_FALLS, NOWHERE];

const matchingIds = (config: Partial<ObservationFilterConfig>, additionalFilters?: Partial<ObservationFilterConfig>): string[] => {
  const filters = filtersForConfig(FORECAST_ZONES, createDefaultFilterConfig(config), additionalFilters, ALTERNATE_ZONES);
  return OBSERVATIONS.filter(o => matchesFilters(o, filters)).map(o => o.id);
};

describe('matchesZone', () => {
  it('resolves an observation to its forecast zone', () => {
    expect(matchesZone(FORECAST_ZONES, GALENA.locationPoint.lat, GALENA.locationPoint.lng, ALTERNATE_ZONES)).toEqual('Galena Summit');
  });

  it('falls back to an observation-only zone when no forecast zone matches', () => {
    expect(matchesZone(FORECAST_ZONES, BOISE.locationPoint.lat, BOISE.locationPoint.lng, ALTERNATE_ZONES)).toEqual('Boise Mountains');
  });

  it('returns Unknown Zone when nothing matches', () => {
    expect(matchesZone(FORECAST_ZONES, NOWHERE.locationPoint.lat, NOWHERE.locationPoint.lng, ALTERNATE_ZONES)).toEqual('Unknown Zone');
  });
});

describe('matchesFilters', () => {
  it('passes everything when no filters are configured', () => {
    expect(matchingIds({})).toEqual(['galena', 'banner', 'boise', 'twinFalls', 'nowhere']);
  });

  it('filters by forecast zone alone', () => {
    expect(matchingIds({zones: ['Galena Summit']})).toEqual(['galena']);
  });

  it('filters by other region alone', () => {
    expect(matchingIds({otherRegions: ['Boise Mountains']})).toEqual(['boise']);
  });

  it('ORs zones together', () => {
    expect(matchingIds({zones: ['Galena Summit', 'Banner Summit']})).toEqual(['galena', 'banner']);
  });

  // Regression: zones and otherRegions are one logical dimension. matchesZone resolves an observation
  // to exactly one name, so AND-ing these two would always produce an empty list.
  it('ORs zones with other regions rather than AND-ing them', () => {
    expect(matchingIds({zones: ['Galena Summit'], otherRegions: ['Boise Mountains']})).toEqual(['galena', 'boise']);
  });

  it('ANDs the location group against other filter groups', () => {
    expect(matchingIds({zones: ['Galena Summit'], observerTypes: [PartnerType.Forecaster]})).toEqual(['galena']);
    expect(matchingIds({zones: ['Banner Summit'], observerTypes: [PartnerType.Forecaster]})).toEqual([]);
  });

  it('applies observer type across an OR-ed location group', () => {
    expect(matchingIds({zones: ['Galena Summit'], otherRegions: ['Twin Falls Area'], observerTypes: [PartnerType.Forecaster]})).toEqual(['galena', 'twinFalls']);
    expect(matchingIds({zones: ['Galena Summit'], otherRegions: ['Boise Mountains'], observerTypes: [PartnerType.Forecaster]})).toEqual(['galena']);
  });

  it('ANDs independent filters with each other', () => {
    expect(matchingIds({observerTypes: [PartnerType.Forecaster], avalanches: ['observed']})).toEqual([]);
  });
});

describe('filtersForConfig', () => {
  it('groups zones and other regions into the location group', () => {
    const filters = filtersForConfig(FORECAST_ZONES, createDefaultFilterConfig({zones: ['Galena Summit'], otherRegions: ['Boise Mountains']}), undefined, ALTERNATE_ZONES);
    expect(filters.map(({type, group}) => ({type, group}))).toEqual([
      {type: 'zone', group: 'location'},
      {type: 'otherRegions', group: 'location'},
    ]);
  });

  it('emits a separately removable pill for each of zones and other regions', () => {
    const filters = filtersForConfig(FORECAST_ZONES, createDefaultFilterConfig({zones: ['Galena Summit'], otherRegions: ['Boise Mountains']}), undefined, ALTERNATE_ZONES);
    expect(filters.map(({label}) => label)).toEqual(['Galena Summit', 'Boise Mountains']);
    expect(filters.every(({removeFilter}) => removeFilter !== undefined)).toBe(true);
  });

  it('locks the zone pill when the zone comes from additionalFilters', () => {
    const filters = filtersForConfig(FORECAST_ZONES, createDefaultFilterConfig({zones: ['Galena Summit']}), {zones: ['Galena Summit']}, ALTERNATE_ZONES);
    expect(filters.map(({type, removeFilter}) => [type, removeFilter !== undefined])).toEqual([['zone', false]]);
  });
});
