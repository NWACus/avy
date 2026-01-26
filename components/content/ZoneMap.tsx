import React from 'react';

import {Region} from 'react-native-maps';

import {RegionBounds, regionFromBounds, updateBoundsToContain} from 'components/helpers/geographicCoordinates';
import {AvalancheForecastZonePolygon, SelectedAvalancheForecastZonePolygon, toLatLngList} from 'components/map/AvalancheForecastZonePolygon';
import {AvalancheCenterID, DangerLevel, Geometry, MapLayerFeature} from 'types/nationalAvalancheCenter';

import Mapbox, {Camera, CameraBounds, MapView} from '@rnmapbox/maps';
import {ViewProps} from 'react-native';

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

interface ZoneMapProps extends ViewProps {
  zones: MapViewZone[];
  initialCameraBounds: CameraBounds;
  onPolygonPress: (zone: MapViewZone) => void;
  selectedZoneId?: number | null;
  renderFillColor?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  onMapPress?: (feature: GeoJSON.Feature) => void;
}

export const ZoneMap = React.forwardRef<Camera, ZoneMapProps>(
  (
    {
      zones,
      selectedZoneId,
      initialCameraBounds,
      onPolygonPress,
      renderFillColor = true,
      pitchEnabled = true,
      rotateEnabled = true,
      scrollEnabled = true,
      zoomEnabled = true,
      onMapPress = undefined,
      children,
      ...props
    },
    cameraRef,
  ) => {
    return (
      <MapView
        styleURL={Mapbox.StyleURL.Outdoors}
        scaleBarEnabled={false}
        zoomEnabled={zoomEnabled}
        pitchEnabled={pitchEnabled}
        rotateEnabled={rotateEnabled}
        scrollEnabled={scrollEnabled}
        onPress={onMapPress}
        {...props}>
        <Camera ref={cameraRef} defaultSettings={{bounds: initialCameraBounds}} />
        {zones?.map(zone => (
          <AvalancheForecastZonePolygon key={`${zone.zone_id}-polygon`} zone={zone} renderFillColor={renderFillColor} onPress={onPolygonPress} />
        ))}
        {selectedZoneId &&
          zones?.filter(zone => zone.zone_id === selectedZoneId).map(zone => <SelectedAvalancheForecastZonePolygon key={`${zone.zone_id}-selectedPolygon`} zone={zone} />)}
        {children}
      </MapView>
    );
  },
);
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
