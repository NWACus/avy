import React from 'react';
import {LatLng, Polygon} from 'react-native-maps';

import {FeatureComponent} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {MapViewZone} from 'hooks/useMapViewZones';
import {RegionBounds, updateBoundsToContain} from './helpers/geographicCoordinates';

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

export interface AvalancheForecastZonePolygonProps {
  zone: MapViewZone;
  setRegionBounds: React.Dispatch<React.SetStateAction<RegionBounds>>;
  setSelectedZone: (zone: MapViewZone) => void;
}

export const AvalancheForecastZonePolygon: React.FunctionComponent<AvalancheForecastZonePolygonProps> = ({
  zone,
  setRegionBounds,
  setSelectedZone,
}: AvalancheForecastZonePolygonProps) => {
  const coordinates: LatLng[] = coordinateList(zone.geometry).map(toLatLng);
  React.useEffect(() => {
    setRegionBounds((previous: RegionBounds) => updateBoundsToContain(previous, coordinates));
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
        // By calling stopPropagation, we prevent this event from getting passed to the MapView's onPress handler,
        // which would then clear the selection
        // https://github.com/react-native-maps/react-native-maps/issues/1132
        event.stopPropagation();
      }}
    />
  );
};
