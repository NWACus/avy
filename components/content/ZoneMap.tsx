import React, {useState} from 'react';

import MapView, {MapViewProps, MAP_TYPES, Region} from 'react-native-maps';

import {AvalancheForecastZonePolygon, toLatLngList} from 'components/AvalancheForecastZonePolygon';
import {RegionBounds, regionFromBounds, updateBoundsToContain} from 'components/helpers/geographicCoordinates';
import {MapViewZone} from 'hooks/useMapViewZones';

const defaultAvalancheCenterMapRegionBounds: RegionBounds = {
  topLeft: {latitude: 0, longitude: 0},
  bottomRight: {latitude: 0, longitude: 0},
};

interface ZoneMapProps extends MapViewProps {
  animated: boolean;
  zones: MapViewZone[];
  selectedZone?: MapViewZone;
  onPressPolygon: (zone: MapViewZone) => void;
}

export const ZoneMap = React.forwardRef<MapView, ZoneMapProps>(({animated, zones, selectedZone, onPressPolygon, children, ...props}, ref) => {
  const [ready, setReady] = useState<boolean>(false);
  const MapComponent = animated ? MapView.Animated : MapView;

  return (
    <MapComponent ref={ref} onLayout={() => setReady(true)} provider={'google'} mapType={MAP_TYPES.TERRAIN} {...props}>
      {ready && zones?.map(zone => <AvalancheForecastZonePolygon key={zone.zone_id} zone={zone} selected={selectedZone === zone} onPress={onPressPolygon} />)}
      {children}
    </MapComponent>
  );
});

export function defaultMapRegionForZones(zones: MapViewZone[]) {
  const avalancheCenterMapRegionBounds: RegionBounds = zones
    ? zones.reduce((accumulator, currentValue) => updateBoundsToContain(accumulator, toLatLngList(currentValue.geometry)), defaultAvalancheCenterMapRegionBounds)
    : defaultAvalancheCenterMapRegionBounds;
  const avalancheCenterMapRegion: Region = regionFromBounds(avalancheCenterMapRegionBounds);
  // give the polygons a little buffer in the region so we don't render them at the outskirts of the screen
  avalancheCenterMapRegion.latitudeDelta *= 1.05;
  avalancheCenterMapRegion.longitudeDelta *= 1.05;
  return avalancheCenterMapRegion;
}
