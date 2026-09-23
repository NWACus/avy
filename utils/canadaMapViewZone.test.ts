import {CanadaForecastAreaFeature, CanadaForecastAreas, CanadaForecastMetadata, DangerLevel} from 'types/nationalAvalancheCenter';
import {canadaDangerLevelFor, canadaMapViewZonesFor} from 'utils/canadaMapViewZone';
import {CarvableFeature} from 'utils/carvePolygonFeatures';

const box = (minX: number, maxX: number): CanadaForecastAreaFeature['geometry'] => ({
  type: 'Polygon',
  coordinates: [
    [
      [minX, 0],
      [maxX, 0],
      [maxX, 1],
      [minX, 1],
      [minX, 0],
    ],
  ],
});

const feature = (id: string, minX = 0, maxX = 10): CanadaForecastAreaFeature => ({
  type: 'Feature',
  id: id,
  geometry: box(minX, maxX),
  properties: {id: id},
});

const mask = (id: number, minX: number, maxX: number): CarvableFeature => ({id: id, geometry: box(minX, maxX)});

const logger = {warn: jest.fn()} as never;

const metadataItem = (id: string, danger: string) => ({
  area: {id: id, name: `area ${id}`},
  url: `https://avalanche.ca/en/forecasts/${id}`,
  highestDanger: {value: danger},
});

describe('canadaDangerLevelFor', () => {
  it.each([
    ['low', DangerLevel.Low],
    ['moderate', DangerLevel.Moderate],
    ['considerable', DangerLevel.Considerable],
    ['high', DangerLevel.High],
    ['extreme', DangerLevel.Extreme],
    ['norating', DangerLevel.GeneralInformation],
    ['offseason', DangerLevel.GeneralInformation],
    ['spring', DangerLevel.GeneralInformation],
  ])('maps %s', (value, expected) => {
    expect(canadaDangerLevelFor(value, 'Glacier')).toEqual(expected);
  });

  it('is case insensitive', () => {
    expect(canadaDangerLevelFor('Considerable', 'Glacier')).toEqual(DangerLevel.Considerable);
  });

  it('falls back to general information and logs an unrecognized rating', () => {
    const logger = {warn: jest.fn()};
    expect(canadaDangerLevelFor('brand-new-rating', 'Glacier', logger as never)).toEqual(DangerLevel.GeneralInformation);
    expect(logger.warn).toHaveBeenCalledWith({value: 'brand-new-rating', area: 'Glacier'}, 'unrecognized avalanche canada danger rating');
  });
});

describe('canadaMapViewZonesFor', () => {
  const areas: CanadaForecastAreas = {type: 'FeatureCollection', features: [feature('a'), feature('b')]};
  const metadata: CanadaForecastMetadata = [metadataItem('a', 'considerable'), metadataItem('b', 'offseason')];

  it('returns no zones until both queries have resolved', () => {
    expect(canadaMapViewZonesFor(undefined, metadata, [], logger)).toEqual([]);
    expect(canadaMapViewZonesFor(areas, undefined, [], logger)).toEqual([]);
    expect(canadaMapViewZonesFor(undefined, undefined, [], logger)).toEqual([]);
  });

  it('joins areas to metadata on the area id', () => {
    expect(canadaMapViewZonesFor(areas, metadata, [], logger)).toEqual([
      {zone_id: 'a', url: 'https://avalanche.ca/en/forecasts/a', danger_level: DangerLevel.Considerable, feature: feature('a')},
      {zone_id: 'b', url: 'https://avalanche.ca/en/forecasts/b', danger_level: DangerLevel.GeneralInformation, feature: feature('b')},
    ]);
  });

  it('drops areas that have no matching metadata', () => {
    expect(canadaMapViewZonesFor(areas, [metadataItem('a', 'high')], [], logger).map(zone => zone.zone_id)).toEqual(['a']);
  });

  it('ignores metadata that has no matching area', () => {
    expect(canadaMapViewZonesFor({type: 'FeatureCollection', features: [feature('a')]}, metadata, [], logger).map(zone => zone.zone_id)).toEqual(['a']);
  });

  it('carves overlapping zones out of the canada areas', () => {
    const zones = canadaMapViewZonesFor(areas, metadata, [mask(1, 4, 6)], logger);
    expect(zones.map(zone => zone.zone_id)).toEqual(['a', 'b']);
    for (const zone of zones) {
      const xs = JSON.stringify(zone.feature.geometry.coordinates);
      expect(xs).not.toContain('5');
      expect(zone.feature.geometry.type).toEqual('MultiPolygon');
    }
  });

  it('drops canada areas that the mask covers entirely', () => {
    expect(canadaMapViewZonesFor(areas, metadata, [mask(1, -1, 11)], logger)).toEqual([]);
  });

  it('leaves the areas untouched when nothing overlaps', () => {
    expect(canadaMapViewZonesFor(areas, metadata, [mask(1, 100, 200)], logger).map(zone => zone.feature)).toEqual([feature('a'), feature('b')]);
  });

  it('preserves properties.id through the carve, since the map press handler matches on it', () => {
    const zones = canadaMapViewZonesFor(areas, metadata, [mask(1, 4, 6)], logger);
    expect(zones.map(zone => zone.feature.properties.id)).toEqual(['a', 'b']);
  });
});
