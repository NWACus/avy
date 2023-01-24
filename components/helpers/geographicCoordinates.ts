import {LatLng, Region} from 'react-native-maps';

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
