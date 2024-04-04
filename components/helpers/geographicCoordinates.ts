import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import {LatLng, Region} from 'react-native-maps';
import {MapLayerFeature, Position} from 'types/nationalAvalancheCenter';

export interface RegionBounds {
  topLeft: LatLng;
  bottomRight: LatLng;
}

export const regionFromBounds = (bounds: RegionBounds): Region => {
  return {
    latitude: (bounds.topLeft.latitude + bounds.bottomRight.latitude) / 2.0,
    latitudeDelta: Math.abs(bounds.topLeft.latitude - bounds.bottomRight.latitude),
    longitude: (bounds.topLeft.longitude + bounds.bottomRight.longitude) / 2.0,
    longitudeDelta: Math.abs(bounds.bottomRight.longitude - bounds.topLeft.longitude),
  };
};

export const updateBoundsToContain = (previous: RegionBounds, coordinates: LatLng[]): RegionBounds => {
  if (!coordinates) {
    return previous;
  }
  const bounds: RegionBounds = {
    topLeft: {latitude: previous.topLeft.latitude, longitude: previous.topLeft.longitude},
    bottomRight: {latitude: previous.bottomRight.latitude, longitude: previous.bottomRight.longitude},
  };
  // for the US, the "top left" corner of a map will have the largest latitude and smallest longitude
  // similarly, the "bottom right" will have the smallest latitude and largest longitude
  for (const coordinate of coordinates) {
    // initialize our points to something on the polygons, so we always
    // end up centered around the polygons we're bounding
    if (bounds.topLeft.longitude === 0) {
      bounds.topLeft = {longitude: coordinate.longitude, latitude: coordinate.latitude};
      bounds.bottomRight = {longitude: coordinate.longitude, latitude: coordinate.latitude};
    } else {
      bounds.topLeft = {
        longitude: Math.min(bounds.topLeft.longitude, coordinate.longitude),
        latitude: Math.max(bounds.topLeft.latitude, coordinate.latitude),
      };
      bounds.bottomRight = {
        longitude: Math.max(bounds.bottomRight.longitude, coordinate.longitude),
        latitude: Math.min(bounds.bottomRight.latitude, coordinate.latitude),
      };
    }
  }

  return bounds;
};

export const emptyBounds = () => ({
  topLeft: {latitude: 0, longitude: 0},
  bottomRight: {latitude: 0, longitude: 0},
});

export const featureBounds = (feature: MapLayerFeature): RegionBounds => {
  // this is glossing over complexity because we only need an outer bounding box. the Polygon GeoJSON type is actually a
  // *list* of coordinate arrays; element 0 is the outer bounds of the polygon, while elements 1-N represent holes.
  // MultiPolygon is an array of polygons.
  if (feature.geometry.type !== 'MultiPolygon' && feature.geometry.type !== 'Polygon') {
    throw new Error(`bounds for ${feature.geometry.type} geometry not implemented!`);
  }
  const outerBorderPoints: Position[] = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates.map(p => p[0]).flat() : feature.geometry.coordinates[0];
  return updateBoundsToContain(
    emptyBounds(),
    outerBorderPoints.map(([longitude, latitude]) => ({latitude, longitude})),
  );
};

// Given a list of RegionBounds, calculate a total region bounding box
export const boundsForRegions = (bounds: RegionBounds[]): RegionBounds => ({
  topLeft: {latitude: Math.max(...bounds.map(b => b.topLeft.latitude)), longitude: Math.min(...bounds.map(b => b.topLeft.longitude))},
  bottomRight: {latitude: Math.min(...bounds.map(b => b.bottomRight.latitude)), longitude: Math.max(...bounds.map(b => b.bottomRight.longitude))},
});

export const pointInBounds = ({latitude, longitude}: LatLng, {topLeft, bottomRight}: RegionBounds): boolean =>
  latitude >= bottomRight.latitude && latitude <= topLeft.latitude && longitude <= bottomRight.latitude && longitude >= topLeft.longitude;

export const pointInFeature = ({latitude, longitude}: LatLng, feature: MapLayerFeature): boolean => {
  return (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') && booleanPointInPolygon([longitude, latitude], feature.geometry);
};
