import {DangerLevel, MapLayerFeature, ObservationZonesFeature, Position} from 'types/nationalAvalancheCenter';
import {interiorPoint, observationOnlyZones} from 'utils/observationOnlyZones';

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

// Bounding boxes of the real SNFAC zones. The four forecast zones come from the center_id === 'SNFAC'
// subset of the v2 map-layer response; the seven alternate zones come from the center's observation
// area KML. Note that the KML spells zone 2906 "Sawtooths", plural.
const SNFAC_FORECAST_ZONES: MapLayerFeature[] = [
  forecastZone(2904, 'Galena Summit & Eastern Mtns', -114.9308, -113.9654, 43.6161, 44.2609),
  forecastZone(2905, 'Soldier & Wood River Valley Mtns', -115.1128, -113.9101, 43.2953, 43.809),
  forecastZone(2906, 'Sawtooth & Western Smoky Mtns', -115.2021, -114.6725, 43.6039, 44.3986),
  forecastZone(2907, 'Banner Summit', -115.4728, -114.8979, 44.2574, 44.527),
];

const SNFAC_ALTERNATE_ZONES: ObservationZonesFeature[] = [
  alternateZone(-100000, 'Galena Summit & Eastern Mtns', -114.9308, -113.9654, 43.6161, 44.2618),
  alternateZone(-100001, 'Soldier & Wood River Valley Mtns', -115.1104, -113.8736, 43.2961, 43.8053),
  alternateZone(-100002, 'Sawtooths & Western Smoky Mtns', -115.2021, -114.6725, 43.6039, 44.2618),
  alternateZone(-100003, 'Banner Summit', -115.4739, -114.8951, 44.2882, 44.5309),
  alternateZone(-100004, 'Boise Mountains', -116.2603, -115.074, 43.3306, 44.5538),
  alternateZone(-100005, 'Challis/Lost River/Lemhi', -114.9502, -112.603, 43.3306, 45.2474),
  alternateZone(-100006, 'Twin Falls/Burley Area', -114.5649, -112.8393, 41.9871, 42.5449),
];

const namesOf = (zones: ObservationZonesFeature[] | undefined): string[] => (zones ?? []).map(zone => zone.properties.name);

describe('interiorPoint', () => {
  it('returns a point inside a Polygon', () => {
    const point = interiorPoint({type: 'Polygon', coordinates: bboxRing(-115, -114, 43, 44)});
    expect(point).toBeDefined();
    expect(point?.[0]).toBeGreaterThan(-115);
    expect(point?.[0]).toBeLessThan(-114);
    expect(point?.[1]).toBeGreaterThan(43);
    expect(point?.[1]).toBeLessThan(44);
  });

  it('uses the largest polygon of a MultiPolygon', () => {
    const sliver = bboxRing(-100, -99.99, 40, 40.01);
    const main = bboxRing(-115, -114, 43, 44);
    const point = interiorPoint({type: 'MultiPolygon', coordinates: [sliver, main]});
    expect(point).toBeDefined();
    expect(point?.[0]).toBeGreaterThan(-115);
    expect(point?.[0]).toBeLessThan(-114);
    expect(point?.[1]).toBeGreaterThan(43);
    expect(point?.[1]).toBeLessThan(44);
  });

  it('returns undefined for a Point geometry', () => {
    expect(interiorPoint({type: 'Point', coordinates: [-115, 43]})).toBeUndefined();
  });

  it('returns undefined for a Polygon with no rings', () => {
    expect(interiorPoint({type: 'Polygon', coordinates: []})).toBeUndefined();
  });

  it('returns undefined for a Polygon with an empty outer ring', () => {
    expect(interiorPoint({type: 'Polygon', coordinates: [[]]})).toBeUndefined();
  });

  it('returns undefined for a MultiPolygon with no usable polygons', () => {
    expect(interiorPoint({type: 'MultiPolygon', coordinates: [[[]]]})).toBeUndefined();
  });
});

describe('observationOnlyZones', () => {
  it('keeps only the SNFAC zones that have no forecast', () => {
    expect(namesOf(observationOnlyZones(SNFAC_ALTERNATE_ZONES, SNFAC_FORECAST_ZONES))).toStrictEqual(['Boise Mountains', 'Challis/Lost River/Lemhi', 'Twin Falls/Burley Area']);
  });

  it('excludes a zone whose name differs from the forecast zone but whose geometry matches', () => {
    expect(namesOf(observationOnlyZones(SNFAC_ALTERNATE_ZONES, SNFAC_FORECAST_ZONES))).not.toContain('Sawtooths & Western Smoky Mtns');
  });

  it('retains Challis/Lost River/Lemhi, which abuts Galena Summit without overlapping it', () => {
    expect(namesOf(observationOnlyZones(SNFAC_ALTERNATE_ZONES, SNFAC_FORECAST_ZONES))).toContain('Challis/Lost River/Lemhi');
  });

  it('excludes an exact name match without consulting geometry', () => {
    const displaced = [alternateZone(-100000, 'Banner Summit', 10, 11, 10, 11)];
    expect(observationOnlyZones(displaced, SNFAC_FORECAST_ZONES)).toStrictEqual([]);
  });

  it('retains a zone whose interior point cannot be determined', () => {
    const pointZone: ObservationZonesFeature = {
      type: 'Feature',
      id: -100000,
      geometry: {type: 'Point', coordinates: [-115, 44]},
      properties: {name: 'Somewhere Inside Banner Summit', center_id: 'SNFAC'},
    };
    expect(namesOf(observationOnlyZones([pointZone], SNFAC_FORECAST_ZONES))).toStrictEqual(['Somewhere Inside Banner Summit']);
  });

  it('returns every alternate zone when the center has no forecast zones', () => {
    expect(namesOf(observationOnlyZones(SNFAC_ALTERNATE_ZONES, []))).toStrictEqual(namesOf(SNFAC_ALTERNATE_ZONES));
  });

  it('passes undefined through', () => {
    expect(observationOnlyZones(undefined, SNFAC_FORECAST_ZONES)).toBeUndefined();
  });

  it('returns an empty list for an empty list', () => {
    expect(observationOnlyZones([], SNFAC_FORECAST_ZONES)).toStrictEqual([]);
  });
});
