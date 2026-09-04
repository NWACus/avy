import {MapViewZone} from 'components/map/ZoneMap';
import {zoneIdsOverlappingCenter} from 'components/map/zoneOverlap';
import {AvalancheCenterID, DangerLevel, Geometry, MapLayerFeature, Position} from 'types/nationalAvalancheCenter';

const bboxRing = (west: number, east: number, south: number, north: number): Position[][] => [
  [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ],
];

const box = (west: number, east: number, south: number, north: number): Geometry => ({type: 'Polygon', coordinates: bboxRing(west, east, south, north)});

const zone = (zone_id: number, center_id: AvalancheCenterID, geometry: Geometry): MapViewZone => ({
  zone_id: zone_id,
  center_id: center_id,
  name: `zone ${zone_id}`,
  danger_level: DangerLevel.Considerable,
  start_date: null,
  end_date: null,
  feature: {type: 'Feature', id: zone_id, geometry: geometry, properties: {}} as unknown as MapLayerFeature,
  fillOpacity: 0.5,
  hasWarning: false,
});

// CBAC is the overlay drawn on top of CAIC's statewide zones, so every case reads base = 'CAIC', overlay = 'CBAC'.
const overlappedCAICZoneIds = (zones: MapViewZone[]): number[] => [...zoneIdsOverlappingCenter(zones, 'CAIC', 'CBAC')].sort((a, b) => a - b);

describe('zoneIdsOverlappingCenter', () => {
  it('reports a base zone that fully contains the overlay', () => {
    const zones = [zone(1, 'CAIC', box(-107, -106, 38, 39)), zone(2, 'CAIC', box(-105, -104, 38, 39)), zone(3, 'CBAC', box(-106.8, -106.6, 38.6, 38.8))];

    expect(overlappedCAICZoneIds(zones)).toEqual([1]);
  });

  it('reports both base zones when the overlay straddles them', () => {
    const zones = [zone(1, 'CAIC', box(-107, -106, 38, 39)), zone(2, 'CAIC', box(-106, -105, 38, 39)), zone(3, 'CBAC', box(-106.5, -105.5, 38.4, 38.6))];

    expect(overlappedCAICZoneIds(zones)).toEqual([1, 2]);
  });

  it('reports a base zone that sits entirely inside the overlay', () => {
    // The reverse containment direction: no overlay vertex falls inside the base, only the other way around.
    const zones = [zone(1, 'CAIC', box(-106.8, -106.6, 38.6, 38.8)), zone(2, 'CBAC', box(-107, -106, 38, 39))];

    expect(overlappedCAICZoneIds(zones)).toEqual([1]);
  });

  it('does not report a base zone whose bounding box overlaps the overlay but whose geometry does not', () => {
    // Diagonal neighbours: the boxes share the corner region only, so the bbox prefilter passes and the
    // vertex test has to reject the pair.
    const zones = [zone(1, 'CAIC', box(-107, -106, 38, 39)), zone(2, 'CBAC', box(-106.5, -105.5, 39.5, 40.5)), zone(3, 'CBAC', box(-105, -104, 37, 37.5))];

    expect(overlappedCAICZoneIds(zones)).toEqual([]);
  });

  it('does not report a base zone with no bounding box overlap at all', () => {
    const zones = [zone(1, 'CAIC', box(-105, -104, 40, 41)), zone(2, 'CBAC', box(-107, -106, 38, 39))];

    expect(overlappedCAICZoneIds(zones)).toEqual([]);
  });

  it('reports a base zone matched by the second polygon of a MultiPolygon overlay', () => {
    const zones = [
      zone(1, 'CAIC', box(-107, -106, 38, 39)),
      zone(2, 'CBAC', {type: 'MultiPolygon', coordinates: [bboxRing(-100, -99, 30, 31), bboxRing(-106.8, -106.6, 38.6, 38.8)]}),
    ];

    expect(overlappedCAICZoneIds(zones)).toEqual([1]);
  });

  it('reports a base zone sharing only an edge with the overlay', () => {
    // booleanPointInPolygon counts boundary points as inside, so abutting zones read as overlapping. Pinned
    // here because the alternative breaks identical polygons; the failure direction is the friendlier modal.
    const zones = [zone(1, 'CAIC', box(-107, -106, 38, 39)), zone(2, 'CBAC', box(-106, -105, 38, 39))];

    expect(overlappedCAICZoneIds(zones)).toEqual([1]);
  });

  it('skips a base zone whose geometry cannot be bounded', () => {
    const zones = [zone(1, 'CAIC', {type: 'Point', coordinates: [-106.7, 38.7]}), zone(2, 'CAIC', box(-107, -106, 38, 39)), zone(3, 'CBAC', box(-106.8, -106.6, 38.6, 38.8))];

    expect(overlappedCAICZoneIds(zones)).toEqual([2]);
  });

  it('skips an overlay zone whose geometry cannot be bounded', () => {
    const zones = [zone(1, 'CAIC', box(-107, -106, 38, 39)), zone(2, 'CBAC', {type: 'Point', coordinates: [-106.7, 38.7]})];

    expect(overlappedCAICZoneIds(zones)).toEqual([]);
  });

  it('returns nothing when the overlay center has no zones', () => {
    expect(overlappedCAICZoneIds([zone(1, 'CAIC', box(-107, -106, 38, 39))])).toEqual([]);
  });

  it('returns nothing when the base center has no zones', () => {
    expect(overlappedCAICZoneIds([zone(1, 'CBAC', box(-107, -106, 38, 39))])).toEqual([]);
  });

  it('never reports a zone from a third center sharing the same ground', () => {
    const zones = [zone(1, 'NWAC', box(-107, -106, 38, 39)), zone(2, 'CAIC', box(-107, -106, 38, 39)), zone(3, 'CBAC', box(-106.8, -106.6, 38.6, 38.8))];

    expect(overlappedCAICZoneIds(zones)).toEqual([2]);
  });
});
