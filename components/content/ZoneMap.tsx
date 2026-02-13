import {AvalancheForecastZonePolygon, SelectedAvalancheForecastZonePolygon} from 'components/map/AvalancheForecastZonePolygon';
import React from 'react';
import {AvalancheCenterID, DangerLevel, MapLayerFeature} from 'types/nationalAvalancheCenter';

import Mapbox, {Camera, CameraBounds, MapState, MapView} from '@rnmapbox/maps';
import {ViewProps} from 'react-native';

export const mapViewZoneFor = (feature: MapLayerFeature): MapViewZone => {
  return {
    zone_id: feature.id,
    feature: feature,
    hasWarning: feature.properties.warning.product !== null,
    center_id: feature.properties.center_id,
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
  selectedZoneId?: number | null;
  renderFillColor?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  onPolygonPress?: (zone: MapViewZone) => void;
  onMapPress?: (feature: GeoJSON.Feature) => void;
  onCameraChanged?: (mapState: MapState) => void;
}

export const ZoneMap = React.forwardRef<Camera, ZoneMapProps>(
  (
    {
      zones,
      selectedZoneId,
      initialCameraBounds,
      renderFillColor = true,
      pitchEnabled = true,
      rotateEnabled = true,
      scrollEnabled = true,
      zoomEnabled = true,
      onMapPress = undefined,
      onPolygonPress = undefined,
      onCameraChanged = undefined,
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
        onCameraChanged={onCameraChanged}
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
