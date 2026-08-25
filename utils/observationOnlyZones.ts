import {pointInFeature} from 'components/helpers/geographicCoordinates';
import polylabel from 'polylabel';
import {Geometry, MapLayerFeature, ObservationZonesFeature, Position} from 'types/nationalAvalancheCenter';

const INTERIOR_POINT_PRECISION = 0.001;

const hasOuterRing = (rings: Position[][]): boolean => rings.length > 0 && rings[0].length > 0;

const outerRingBboxArea = (rings: Position[][]): number => {
  const longitudes = rings[0].map(position => position[0]);
  const latitudes = rings[0].map(position => position[1]);
  return (Math.max(...longitudes) - Math.min(...longitudes)) * (Math.max(...latitudes) - Math.min(...latitudes));
};

export const interiorPoint = (geometry: Geometry): Position | undefined => {
  if (geometry.type === 'Polygon') {
    return hasOuterRing(geometry.coordinates) ? polylabel(geometry.coordinates, INTERIOR_POINT_PRECISION) : undefined;
  }
  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates.filter(hasOuterRing);
    if (polygons.length === 0) {
      return undefined;
    }
    const largest = polygons.reduce((a, b) => (outerRingBboxArea(b) > outerRingBboxArea(a) ? b : a));
    return polylabel(largest, INTERIOR_POINT_PRECISION);
  }
  return undefined;
};

export const observationOnlyZones = (alternateZones: ObservationZonesFeature[] | undefined, mapFeatures: MapLayerFeature[]): ObservationZonesFeature[] | undefined => {
  if (!alternateZones) {
    return alternateZones;
  }
  const forecastZoneNames = new Set(mapFeatures.map(feature => feature.properties.name));

  // Check if the zone name is exactly contained, and double check the geometry if not.
  // Zone names are not 100% reliable as they can be misspelled in the data returned from useAlternateObservationZones
  return alternateZones.filter(zone => {
    if (forecastZoneNames.has(zone.properties.name)) {
      return false;
    }
    const point = interiorPoint(zone.geometry);
    if (!point) {
      return true;
    }
    return !mapFeatures.some(feature => pointInFeature(point, feature));
  });
};
