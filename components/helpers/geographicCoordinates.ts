import {CameraBounds} from '@rnmapbox/maps';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import {MapViewZone} from 'components/content/ZoneMap';
import {AvyPosition, Geometry, MapLayerFeature, Position} from 'types/nationalAvalancheCenter';

export interface RegionBounds {
  topRight: AvyPosition;
  bottomLeft: AvyPosition;
}

const defaultAvalancheCenterMapRegionBounds: RegionBounds = {
  topRight: {longitude: 0, latitude: 0},
  bottomLeft: {longitude: 0, latitude: 0},
};

export interface AvalancheCenterRegion {
  centerCoordinate: {longitude: number; latitude: number};
  longitudeDelta: number;
  latitudeDelta: number;
  cameraBounds: CameraBounds;
}

export const toGeoJSONPosition = (avyPosition: AvyPosition): Position => [avyPosition.longitude, avyPosition.latitude];
export const toAvyPosition = (geoJsonPosition: Position): AvyPosition => {
  return {
    longitude: geoJsonPosition[0],
    latitude: geoJsonPosition[1],
  };
};

export const avalancheCenterRegionFromRegionBounds = (bounds: RegionBounds): AvalancheCenterRegion => {
  const centerlong = (bounds.topRight.longitude + bounds.bottomLeft.longitude) / 2.0;
  const centerLat = (bounds.topRight.latitude + bounds.bottomLeft.latitude) / 2.0;
  const longDelta = Math.abs(bounds.bottomLeft.longitude - bounds.topRight.longitude);
  const latDelta = Math.abs(bounds.topRight.latitude - bounds.bottomLeft.latitude);
  const cameraBounds = {
    ne: [centerlong + longDelta / 2.0, centerLat + latDelta / 2.0],
    sw: [centerlong - longDelta / 2.0, centerLat - latDelta / 2.0],
  };
  return {
    centerCoordinate: {
      longitude: centerlong,
      latitude: centerLat,
    },
    longitudeDelta: longDelta,
    latitudeDelta: latDelta,
    cameraBounds: cameraBounds,
  };
};

export const updateBoundsToContain = (previous: RegionBounds, coordinates: Position[]): RegionBounds => {
  if (!coordinates) {
    return previous;
  }
  const bounds: RegionBounds = {
    topRight: {longitude: previous.topRight.longitude, latitude: previous.topRight.latitude},
    bottomLeft: {longitude: previous.bottomLeft.longitude, latitude: previous.bottomLeft.latitude},
  };
  // for the US, the "top left" corner of a map will have the largest latitude and smallest longitude
  // similarly, the "bottom right" will have the smallest latitude and largest longitude
  for (const coordinate of coordinates) {
    // initialize our points to something on the polygons, so we always
    // end up centered around the polygons we're bounding
    const newCoordinate = toAvyPosition(coordinate);
    if (bounds.topRight.longitude === 0) {
      bounds.topRight = newCoordinate;
      bounds.bottomLeft = newCoordinate;
    } else {
      bounds.topRight = {longitude: Math.max(bounds.topRight.longitude, newCoordinate.longitude), latitude: Math.max(bounds.topRight.latitude, newCoordinate.latitude)};
      bounds.bottomLeft = {longitude: Math.min(bounds.bottomLeft.longitude, newCoordinate.longitude), latitude: Math.min(bounds.bottomLeft.latitude, newCoordinate.latitude)};
    }
  }

  return bounds;
};

export const emptyBounds = (): RegionBounds => ({
  topRight: {longitude: 0, latitude: 0},
  bottomLeft: {longitude: 0, latitude: 0},
});

export const featureBounds = (feature: MapLayerFeature): RegionBounds => {
  // this is glossing over complexity because we only need an outer bounding box. the Polygon GeoJSON type is actually a
  // *list* of coordinate arrays; element 0 is the outer bounds of the polygon, while elements 1-N represent holes.
  // MultiPolygon is an array of polygons.
  if (feature.geometry.type !== 'MultiPolygon' && feature.geometry.type !== 'Polygon') {
    throw new Error(`bounds for ${feature.geometry.type} geometry not implemented!`);
  }
  const outerBorderPoints: Position[] = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates.map(p => p[0]).flat() : feature.geometry.coordinates[0];
  return updateBoundsToContain(emptyBounds(), outerBorderPoints);
};

// Given a list of RegionBounds, calculate a total region bounding box
export const boundsForRegions = (bounds: RegionBounds[]): RegionBounds => ({
  topRight: {longitude: Math.max(...bounds.map(b => b.topRight.longitude)), latitude: Math.max(...bounds.map(b => b.topRight.latitude))},
  bottomLeft: {longitude: Math.min(...bounds.map(b => b.bottomLeft.longitude)), latitude: Math.min(...bounds.map(b => b.bottomLeft.latitude))},
});

export const pointInBounds = (position: AvyPosition, {topRight, bottomLeft}: RegionBounds): boolean =>
  position.latitude >= bottomLeft.latitude && position.latitude <= topRight.latitude && position.longitude >= bottomLeft.longitude && position.longitude >= topRight.longitude;

export const pointInFeature = (position: Position, feature: MapLayerFeature): boolean => {
  return (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') && booleanPointInPolygon(position, feature.geometry);
};

const coordinateList = (geometry: Geometry): number[][][] => {
  let items: number[][][] = [];
  if (geometry.type === 'Polygon') {
    items = [geometry.coordinates[0]];
  } else if (geometry.type === 'MultiPolygon') {
    items = geometry.coordinates.map(coordinates => coordinates[0]);
  }
  return items;
};

export const toPositionList = (geometry: Geometry | undefined): Position[][] => {
  if (!geometry) {
    return [];
  }
  return coordinateList(geometry);
};

export function defaultMapRegionForZones(zones: MapViewZone[]) {
  return defaultMapRegionForGeometries(zones.map(zone => zone.feature.geometry));
}

export function defaultMapRegionForGeometries(geometries: (Geometry | undefined)[] | undefined) {
  const avalancheCenterMapRegionBounds: RegionBounds = geometries
    ? geometries.reduce((accumulator, currentValue) => updateBoundsToContain(accumulator, toPositionList(currentValue).flat()), defaultAvalancheCenterMapRegionBounds)
    : defaultAvalancheCenterMapRegionBounds;

  const avalancheCenterRegion = avalancheCenterRegionFromRegionBounds(avalancheCenterMapRegionBounds);
  avalancheCenterRegion.latitudeDelta *= 1.05;
  avalancheCenterRegion.longitudeDelta *= 1.05;
  return avalancheCenterRegion;
}
