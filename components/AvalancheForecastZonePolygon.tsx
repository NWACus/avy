import React from 'react';
import {LatLng, Polygon, Region} from 'react-native-maps';

import {FeatureComponent} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {MapViewZone} from 'hooks/useMapViewZones';

const coordinateList = (geometry: FeatureComponent): number[][] => {
  let items: number[][] = [];
  if (geometry.type === 'Polygon') {
    items = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    items = geometry.coordinates[0][0];
  }
  return items;
};

const toLatLng = (item: number[]): LatLng => {
  return {longitude: item[0], latitude: item[1]};
};

export const updateRegionToContain = (previous: Region, coordinates: LatLng[]): Region => {
  if (!coordinates) {
    return previous;
  }
  // for the US, the "top left" corner of a map will have the largest latitude and smallest longitude
  const topLeft: LatLng = {
    longitude: previous.longitude - previous.longitudeDelta / 2,
    latitude: previous.latitude + previous.longitudeDelta / 2,
  };
  // similarly, the "bottom right" will have the smallest latitude and largest longitude
  const bottomRight: LatLng = {
    longitude: previous.longitude + previous.longitudeDelta / 2,
    latitude: previous.latitude - previous.longitudeDelta / 2,
  };
  for (const coordinate of coordinates) {
    // initialize our points to something on the polygons, so we always
    // end up centered around the polygons we're bounding
    if (topLeft.longitude === 0) {
      topLeft.longitude = coordinate.longitude;
      topLeft.latitude = coordinate.latitude;
      bottomRight.longitude = coordinate.longitude;
      bottomRight.latitude = coordinate.latitude;
    }
    if (coordinate.longitude < topLeft.longitude) {
      topLeft.longitude = coordinate.longitude;
    }
    if (coordinate.longitude > bottomRight.longitude) {
      bottomRight.longitude = coordinate.longitude;
    }

    if (coordinate.latitude > topLeft.latitude) {
      topLeft.latitude = coordinate.latitude;
    }
    if (coordinate.latitude < bottomRight.latitude) {
      bottomRight.latitude = coordinate.latitude;
    }
  }
  return {
    latitude: (topLeft.latitude + bottomRight.latitude) / 2,
    latitudeDelta: topLeft.latitude - bottomRight.latitude,
    longitude: (topLeft.longitude + bottomRight.longitude) / 2,
    longitudeDelta: bottomRight.longitude - topLeft.longitude,
  };
};

export interface AvalancheForecastZonePolygonProps {
  zone: MapViewZone;
  setRegion: React.Dispatch<React.SetStateAction<Region>>;
  setSelectedZone: (zone: MapViewZone) => void;
}

export const AvalancheForecastZonePolygon: React.FunctionComponent<AvalancheForecastZonePolygonProps> = ({zone, setRegion, setSelectedZone}: AvalancheForecastZonePolygonProps) => {
  const coordinates: LatLng[] = coordinateList(zone.geometry).map(toLatLng);
  React.useEffect(() => {
    setRegion((previous: Region) => updateRegionToContain(previous, coordinates));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Polygon
      coordinates={coordinates}
      fillColor={colorFor(zone.danger_level).alpha(zone.fillOpacity).string()}
      strokeColor={'#484848'}
      strokeWidth={2}
      tappable={true}
      onPress={event => {
        setSelectedZone(zone);
        event.stopPropagation();
      }}
    />
  );
};
