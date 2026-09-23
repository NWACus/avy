import type {ZonePolygonStyle} from 'components/map/AvalancheForecastZonePolygon';
import type {MapViewZone} from 'components/map/ZoneMap';

export interface ZoneDrawOrder {
  baseZones: MapViewZone[];
  overlappingZones: MapViewZone[];
}

// Mapbox paints in child order, and the coverageEdge style exists so an overlapping center can outline
// itself above the zones it covers. Holding those zones back into their own group is what keeps them on
// top of both the base fills and the base warning pulse, which draws over those fills. Relative order
// within each group is preserved, so the CBAC-last ordering that useAllMapLayers builds still decides
// which overlapping zone wins a tap.
export const partitionZonesByDrawOrder = (zones: MapViewZone[] | undefined, styleFor: (zone: MapViewZone) => ZonePolygonStyle): ZoneDrawOrder => {
  const baseZones: MapViewZone[] = [];
  const overlappingZones: MapViewZone[] = [];
  zones?.forEach(zone => (styleFor(zone) === 'default' ? baseZones : overlappingZones).push(zone));
  return {baseZones: baseZones, overlappingZones: overlappingZones};
};
