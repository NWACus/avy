import {ZonePolygonStyle} from 'components/map/AvalancheForecastZonePolygon';
import {MapViewZone} from 'components/map/ZoneMap';
import {partitionZonesByDrawOrder} from 'components/map/zoneDrawOrder';
import {AvalancheCenterID, DangerLevel, MapLayerFeature} from 'types/nationalAvalancheCenter';

const zone = (zone_id: number, center_id: AvalancheCenterID): MapViewZone => ({
  zone_id: zone_id,
  center_id: center_id,
  name: `zone ${zone_id}`,
  danger_level: DangerLevel.Considerable,
  start_date: null,
  end_date: null,
  feature: {} as MapLayerFeature,
  fillOpacity: 0.5,
  hasWarning: false,
});

// Mirrors AvalancheForecastMapView: CBAC is the only center that overlaps another, and which of the two
// overlapping treatments it gets depends on whether the user is in the no-center experience.
const cbacStyle =
  (styleWhenOverlapping: ZonePolygonStyle) =>
  (candidate: MapViewZone): ZonePolygonStyle =>
    candidate.center_id === 'CBAC' ? styleWhenOverlapping : 'default';

describe('partitionZonesByDrawOrder', () => {
  it.each<ZonePolygonStyle>(['opaqueFill', 'coverageEdge'])('holds %s zones back so they draw last', style => {
    const zones = [zone(1, 'CAIC'), zone(2, 'CBAC'), zone(3, 'NWAC')];

    const {baseZones, overlappingZones} = partitionZonesByDrawOrder(zones, cbacStyle(style));

    expect(baseZones.map(z => z.zone_id)).toEqual([1, 3]);
    expect(overlappingZones.map(z => z.zone_id)).toEqual([2]);
  });

  it('holds overlapping zones back even when they arrive before the zones they cover', () => {
    const zones = [zone(2, 'CBAC'), zone(1, 'CAIC')];

    const {baseZones, overlappingZones} = partitionZonesByDrawOrder(zones, cbacStyle('opaqueFill'));

    expect(baseZones.map(z => z.zone_id)).toEqual([1]);
    expect(overlappingZones.map(z => z.zone_id)).toEqual([2]);
  });

  it('preserves relative order within each group so the last overlapping zone still wins a tap', () => {
    const zones = [zone(1, 'CAIC'), zone(3, 'NWAC'), zone(4, 'CBAC'), zone(5, 'CBAC')];

    const {baseZones, overlappingZones} = partitionZonesByDrawOrder(zones, cbacStyle('opaqueFill'));

    expect(baseZones.map(z => z.zone_id)).toEqual([1, 3]);
    expect(overlappingZones.map(z => z.zone_id)).toEqual([4, 5]);
  });

  it('puts every zone in the base group when no zones overlap', () => {
    const zones = [zone(1, 'NWAC'), zone(2, 'SNFAC')];

    const {baseZones, overlappingZones} = partitionZonesByDrawOrder(zones, cbacStyle('opaqueFill'));

    expect(baseZones.map(z => z.zone_id)).toEqual([1, 2]);
    expect(overlappingZones).toEqual([]);
  });

  it('tolerates undefined zones', () => {
    expect(partitionZonesByDrawOrder(undefined, cbacStyle('opaqueFill'))).toEqual({baseZones: [], overlappingZones: []});
  });
});
