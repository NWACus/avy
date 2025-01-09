import React from 'react';

import Constants, {AppOwnership} from 'expo-constants';
import MapView, {MAP_TYPES, MapViewProps, PoiClickEvent, Region} from 'react-native-maps';

import {RegionBounds, regionFromBounds, updateBoundsToContain} from 'components/helpers/geographicCoordinates';
import {AvalancheForecastZonePolygon, toLatLngList} from 'components/map/AvalancheForecastZonePolygon';
import {useToggle} from 'hooks/useToggle';
import {AvalancheCenterID, DangerLevel, Geometry, MapLayerFeature} from 'types/nationalAvalancheCenter';

const defaultAvalancheCenterMapRegionBounds: RegionBounds = {
  topLeft: {latitude: 0, longitude: 0},
  bottomRight: {latitude: 0, longitude: 0},
};

export const mapViewZoneFor = (center: AvalancheCenterID, feature: MapLayerFeature): MapViewZone => {
  return {
    zone_id: feature.id,
    feature: feature,
    hasWarning: feature.properties.warning.product !== null,
    center_id: center,
    name: feature.properties.name,
    danger_level: feature.properties.danger_level,
    start_date: feature.properties.start_date,
    end_date: feature.properties.end_date,
    fillOpacity: feature.properties.fillOpacity,
  };
};

export type MapViewZone = {
  center_id: AvalancheCenterID;
  zone_id: number;
  name: string;
  danger_level?: DangerLevel;
  start_date: string | null;
  end_date: string | null;
  feature: MapLayerFeature;
  fillOpacity: number;
  hasWarning: boolean;
};

interface ZoneMapProps extends MapViewProps {
  animated: boolean;
  zones: MapViewZone[];
  selectedZoneId?: number | null;
  renderFillColor?: boolean;
  onPressPolygon: (zone: MapViewZone) => void;
  onPoiClick?: (event: PoiClickEvent) => void;
}

export const ZoneMap = React.forwardRef<MapView, ZoneMapProps>(({animated, zones, selectedZoneId, onPressPolygon, renderFillColor = true, children, ...props}, ref) => {
  const [ready, {on: setReady}] = useToggle(false);
  const MapComponent = animated ? MapView.Animated : MapView;
  const isRunningInExpoGo = Constants.appOwnership === AppOwnership.Expo;

  return (
    <MapComponent ref={ref} onLayout={setReady} provider={isRunningInExpoGo ? undefined : 'google'} mapType={MAP_TYPES.TERRAIN} {...props}>
      {ready &&
        zones?.map(zone => (
          <AvalancheForecastZonePolygon key={zone.zone_id} zone={zone} selected={selectedZoneId === zone.zone_id} renderFillColor={renderFillColor} onPress={onPressPolygon} />
        ))}
      {children}
    </MapComponent>
  );
});
ZoneMap.displayName = 'ZoneMap';

export function defaultMapRegionForZones(zones: MapViewZone[]) {
  return defaultMapRegionForGeometries(zones.map(zone => zone.feature.geometry));
}

export function defaultMapRegionForGeometries(geometries: (Geometry | undefined)[] | undefined) {
  const avalancheCenterMapRegionBounds: RegionBounds = geometries
    ? geometries.reduce((accumulator, currentValue) => updateBoundsToContain(accumulator, toLatLngList(currentValue).flat()), defaultAvalancheCenterMapRegionBounds)
    : defaultAvalancheCenterMapRegionBounds;
  const avalancheCenterMapRegion: Region = regionFromBounds(avalancheCenterMapRegionBounds);
  // give the polygons a little buffer in the region so we don't render them at the outskirts of the screen
  avalancheCenterMapRegion.latitudeDelta *= 1.05;
  avalancheCenterMapRegion.longitudeDelta *= 1.05;
  return avalancheCenterMapRegion;
}
