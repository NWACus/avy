import {AvalancheForecastZonePolygon, SelectedAvalancheForecastZonePolygon} from 'components/map/AvalancheForecastZonePolygon';
import React, {RefObject, useMemo} from 'react';
import {AvalancheCenterID, DangerLevel, MapLayerFeature} from 'types/nationalAvalancheCenter';

import Mapbox, {Camera, CameraBounds, CameraStop, MapState, MapView} from '@rnmapbox/maps';
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

// If both initialCameraBounds and initialCameraStop are passed in, then initialCameraStop will take priority when setting the Camera
interface ZoneMapProps extends ViewProps {
  zones: MapViewZone[];
  initialCameraBounds: CameraBounds;
  initialCameraStop?: CameraStop;
  cameraRef?: RefObject<Camera | null>;
  selectedZoneId?: number | null;
  renderFillColor?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  onPolygonPress?: (zone: MapViewZone) => void;
  onMapPress?: (feature: GeoJSON.Feature) => void;
  onCameraChanged?: (mapState: MapState) => void;
}

export const ZoneMap: React.FunctionComponent<ZoneMapProps> = ({
  zones,
  cameraRef,
  selectedZoneId,
  initialCameraBounds,
  initialCameraStop,
  renderFillColor = true,
  rotateEnabled = true,
  scrollEnabled = true,
  zoomEnabled = true,
  onMapPress = undefined,
  onPolygonPress = undefined,
  onCameraChanged = undefined,
  children,
  ...props
}) => {
  const zonePolygons = useMemo(() => {
    return zones?.map(zone => <AvalancheForecastZonePolygon key={`${zone.zone_id}-polygon`} zone={zone} renderFillColor={renderFillColor} onPress={onPolygonPress} />);
  }, [zones, renderFillColor, onPolygonPress]);

  const selectedPolygon = useMemo(() => {
    if (selectedZoneId !== null) {
      return zones?.filter(zone => zone.zone_id === selectedZoneId).map(zone => <SelectedAvalancheForecastZonePolygon key={`${zone.zone_id}-selectedPolygon`} zone={zone} />);
    }

    return null;
  }, [zones, selectedZoneId]);

  return (
    <MapView
      styleURL={Mapbox.StyleURL.Outdoors}
      scaleBarEnabled={false}
      zoomEnabled={zoomEnabled}
      pitchEnabled={false}
      rotateEnabled={rotateEnabled}
      scrollEnabled={scrollEnabled}
      onPress={onMapPress}
      onCameraChanged={onCameraChanged}
      {...props}>
      <Camera ref={cameraRef} defaultSettings={initialCameraStop ?? {bounds: initialCameraBounds}} />
      {zonePolygons}
      {selectedPolygon}
      {children}
    </MapView>
  );
};
ZoneMap.displayName = 'ZoneMap';
