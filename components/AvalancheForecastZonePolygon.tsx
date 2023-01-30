import React from 'react';
import {LatLng, Polygon} from 'react-native-maps';

import {FeatureComponent} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {MapViewZone} from 'hooks/useMapViewZones';
import {colorLookup} from '../theme';

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

export const toLatLngList = (geometry: FeatureComponent): LatLng[] => {
  return coordinateList(geometry).map(toLatLng);
};

export interface AvalancheForecastZonePolygonProps {
  zone: MapViewZone;
  selected: boolean;
  onPress: (zone: MapViewZone) => void;
}

export const AvalancheForecastZonePolygon: React.FunctionComponent<AvalancheForecastZonePolygonProps> = ({zone, selected, onPress}: AvalancheForecastZonePolygonProps) => {
  const outline = colorLookup('gray.700');
  const highlight = colorLookup('blue.100');
  return (
    <Polygon
      coordinates={toLatLngList(zone.geometry)}
      fillColor={colorFor(zone.danger_level).alpha(zone.fillOpacity).string()}
      strokeColor={selected ? highlight.toString() : outline.toString()}
      strokeWidth={selected ? 4 : 2}
      tappable={true}
      zIndex={selected ? 1 : 0}
      onPress={event => {
        onPress(zone);
        // By calling stopPropagation, we prevent this event from getting passed to the MapView's onPress handler,
        // which would then clear the selection
        // https://github.com/react-native-maps/react-native-maps/issues/1132
        event.stopPropagation();
      }}
    />
  );
};
