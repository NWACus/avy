import {AvalancheForecastZonePolygon, SelectedAvalancheForecastZonePolygon, ZonePolygonStyle} from 'components/map/AvalancheForecastZonePolygon';
import {useWarningPulse, useWarningPulseShape, WarningPulseOverlay} from 'components/map/WarningPulseOverlay';
import {partitionZonesByDrawOrder} from 'components/map/zoneDrawOrder';
import React, {RefObject, useCallback, useMemo} from 'react';
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
  zonePolygonStyle?: (zone: MapViewZone) => ZonePolygonStyle;
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
  zonePolygonStyle = undefined,
  rotateEnabled = true,
  scrollEnabled = true,
  zoomEnabled = true,
  onMapPress = undefined,
  onPolygonPress = undefined,
  onCameraChanged = undefined,
  children,
  ...props
}) => {
  const styleFor = useCallback((zone: MapViewZone): ZonePolygonStyle => (zonePolygonStyle ? zonePolygonStyle(zone) : 'default'), [zonePolygonStyle]);

  const {baseZones, overlappingZones} = useMemo(() => partitionZonesByDrawOrder(zones, styleFor), [zones, styleFor]);

  const polygonsFor = useCallback(
    (groupZones: MapViewZone[]) =>
      groupZones.map(zone => (
        <AvalancheForecastZonePolygon key={`${zone.zone_id}-polygon`} zone={zone} renderFillColor={renderFillColor} polygonStyle={styleFor(zone)} onPress={onPolygonPress} />
      )),
    [renderFillColor, styleFor, onPolygonPress],
  );
  const basePolygons = useMemo(() => polygonsFor(baseZones), [polygonsFor, baseZones]);
  const overlappingPolygons = useMemo(() => polygonsFor(overlappingZones), [polygonsFor, overlappingZones]);

  // Warning zones are collected into a shared source rather than animated one by one, because on a bad
  // day most of the country is warning at once. Nearly all of them land in the base group; coverageEdge
  // zones are excluded because they draw an outline rather than a fill, so they have nothing to pulse.
  const basePulseShape = useWarningPulseShape(renderFillColor ? baseZones.filter(zone => zone.hasWarning) : []);
  const overlappingPulseShape = useWarningPulseShape(renderFillColor ? overlappingZones.filter(zone => zone.hasWarning && styleFor(zone) !== 'coverageEdge') : []);
  const pulse = useWarningPulse(basePulseShape.features.length > 0 || overlappingPulseShape.features.length > 0);

  const selectedPolygon = useMemo(() => {
    if (selectedZoneId !== null) {
      const selectedZone = zones?.find(zone => zone.zone_id === selectedZoneId);
      return selectedZone ? <SelectedAvalancheForecastZonePolygon key={`${selectedZone.zone_id}-selectedPolygon`} zone={selectedZone} /> : null;
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
      {basePolygons}
      <WarningPulseOverlay id="warning-pulse-base" shape={basePulseShape} pulse={pulse} />
      {overlappingPolygons}
      <WarningPulseOverlay id="warning-pulse-overlapping" shape={overlappingPulseShape} pulse={pulse} />
      {selectedPolygon}
      {children}
    </MapView>
  );
};
ZoneMap.displayName = 'ZoneMap';
