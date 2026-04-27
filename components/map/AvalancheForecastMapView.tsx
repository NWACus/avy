import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StyleSheet, useWindowDimensions} from 'react-native';

import {AnimatedDrawerState, AnimatedMapWithDrawerController} from 'components/map/AnimatedCards';
import {MapViewZone, ZoneMap} from 'components/map/ZoneMap';
import {CenterNotSupportedModal} from 'components/modals/CenterNotSupportedModal';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useMapPersistence} from 'MapPersistence';
import {usePreferences} from 'Preferences';
import {MainStackNavigationProps} from 'routes';
import {AvalancheCenterID, isSupportedCenter} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime} from 'utils/date';

import {Camera, CameraStop, MapState} from '@rnmapbox/maps';
import {defaultMapRegionForGeometries} from 'components/helpers/geographicCoordinates';
import {AvalancheForecastZoneCards} from 'components/map/AvalancheForecastZoneCards';
import {TopElementMeasurments} from 'components/map/AvalancheForecastZoneMap';
import {Position} from 'geojson';

interface AvalancheForecastMapViewProps {
  preferredCenterId: AvalancheCenterID;
  zones: MapViewZone[];
  requestedTime: RequestedTime;
  selectedZoneId: number | null;
  tabBarHeight: number;
  setSelectedZoneId: React.Dispatch<React.SetStateAction<number | null>>;
  topElementMeasurements?: TopElementMeasurments;
  userLocation?: Position | undefined;
}

// These map zoom level thresholds control when the AnimatedCards are automatically hidden and when the isInNoCenterExperience triggers
// In Mapbox, the levels start at 0 (most zoomed out) and go to 22 (most zoomed in). The card threshold therefore happens first and then the no center experience is triggered
// This prevents all the changes from happening at once
const CARD_HIDDEN_ZOOM_THRESHOLD = 6;
const NO_CENTER_EXPERIENCE_ZOOM_THRESHOLD = 5;

export const AvalancheForecastMapView: React.FunctionComponent<AvalancheForecastMapViewProps> = ({
  preferredCenterId,
  zones,
  requestedTime,
  selectedZoneId,
  tabBarHeight,
  setSelectedZoneId,
  topElementMeasurements = {yPos: 0, height: 0},
  userLocation = undefined,
}: AvalancheForecastMapViewProps) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const {setPreferences} = usePreferences();
  const {isInNoCenterExperience, setIsInNoCenterExperience, initialMapCamera, saveMapCamera} = useMapPersistence();

  const navigation = useNavigation<MainStackNavigationProps>();

  const [unsupportedCenterId, setUnsupportedCenterId] = useState<AvalancheCenterID | null>(null);
  const onCloseUnsupportedModal = useCallback(() => setUnsupportedCenterId(null), []);

  const onMapPresOutsideOfPolygon = useCallback(
    (_: GeoJSON.Feature) => {
      // Since the polygons are layered on the map, this is only called when the map is tapped outside of a polygon
      setSelectedZoneId(null);
    },
    [setSelectedZoneId],
  );

  const onPolygonPress = useCallback(
    (zone: MapViewZone) => {
      if (selectedZoneId === zone.zone_id) {
        navigation.navigate('forecast', {
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          requestedTime: formatRequestedTime(requestedTime),
        });
      } else {
        const selectedZoneCenter = zone.center_id;
        if (isSupportedCenter(selectedZoneCenter)) {
          setSelectedZoneId(zone.zone_id);

          if (selectedZoneCenter !== preferredCenterId) {
            setPreferences({center: selectedZoneCenter});
          }

          if (isInNoCenterExperienceRef.current) {
            setIsInNoCenterExperience(false);
          }
        } else {
          setUnsupportedCenterId(selectedZoneCenter);
        }
      }
    },
    [navigation, selectedZoneId, preferredCenterId, requestedTime, setSelectedZoneId, setPreferences, setIsInNoCenterExperience],
  );

  const preferredCenterZones = useMemo(() => zones.filter(zone => zone.center_id === preferredCenterId), [zones, preferredCenterId]);

  const avalancheCenterMapRegion = useMemo(() => defaultMapRegionForGeometries(preferredCenterZones.map(zone => zone.feature.geometry)), [preferredCenterZones]);

  const isInNoCenterExperienceRef = useRef(isInNoCenterExperience);
  useEffect(() => {
    isInNoCenterExperienceRef.current = isInNoCenterExperience;
  }, [isInNoCenterExperience]);

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapCameraRef = useRef<Camera>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapCameraRef, logger));

  const reanimateOnFocus = useCallback(() => {
    if (!isInNoCenterExperienceRef.current) {
      controller.current.forceAnimateMapRegion();
    }
  }, [controller]);
  useFocusEffect(reanimateOnFocus);

  React.useEffect(() => {
    if (!isInNoCenterExperience) {
      controller.current.animateUsingUpdatedAvalancheCenterMapRegion(avalancheCenterMapRegion);
    }
  }, [avalancheCenterMapRegion, isInNoCenterExperience]);

  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  React.useEffect(() => {
    if (!isInNoCenterExperience) {
      controller.current.animateUsingUpdatedWindowDimensions(windowWidth, windowHeight);
    }
  }, [windowWidth, windowHeight, isInNoCenterExperience, controller]);

  React.useEffect(() => {
    if (!isInNoCenterExperience) {
      controller.current.animateUsingUpdatedTabBarHeight(tabBarHeight);
    }
  }, [tabBarHeight, isInNoCenterExperience, controller]);

  React.useEffect(() => {
    if (!isInNoCenterExperience) {
      controller.current.animateUsingUpdatedTopElementsHeight(topElementMeasurements.yPos, topElementMeasurements.height);
    }
  }, [controller, isInNoCenterExperience, topElementMeasurements]);

  const onCameraChanged = useCallback(
    (mapState: MapState) => {
      if (mapState.gestures.isGestureActive) {
        if (mapState.properties.zoom < CARD_HIDDEN_ZOOM_THRESHOLD && controller.current.state !== AnimatedDrawerState.Hidden) {
          controller.current.setState(AnimatedDrawerState.Hidden, false);
          setSelectedZoneId(null);
        }

        if (!isInNoCenterExperienceRef.current && mapState.properties.zoom < NO_CENTER_EXPERIENCE_ZOOM_THRESHOLD) {
          // Updating the ref here helps prevent unnecessary calls to setIsInNoCenterExperience.
          isInNoCenterExperienceRef.current = true;
          setIsInNoCenterExperience(true);
        }
      }

      if (isInNoCenterExperienceRef.current) {
        saveMapCamera({
          center: mapState.properties.center as [number, number],
          zoom: mapState.properties.zoom,
        });
      }
    },
    [controller, setIsInNoCenterExperience, saveMapCamera, setSelectedZoneId],
  );

  useEffect(() => {
    if (userLocation) {
      mapCameraRef.current?.setCamera({centerCoordinate: userLocation, zoomLevel: 7});
    }
  }, [mapCameraRef, userLocation]);

  const initialCameraStop: CameraStop | undefined = useMemo(() => {
    if (isInNoCenterExperience && initialMapCamera) {
      return {centerCoordinate: initialMapCamera.center, zoomLevel: initialMapCamera.zoom};
    }
    return undefined;
  }, [isInNoCenterExperience, initialMapCamera]);

  return (
    <>
      <ZoneMap
        key={'forecastZoneMap'}
        cameraRef={mapCameraRef}
        style={StyleSheet.absoluteFillObject}
        initialCameraBounds={avalancheCenterMapRegion.cameraBounds}
        initialCameraStop={initialCameraStop}
        zones={zones}
        selectedZoneId={selectedZoneId}
        onPolygonPress={onPolygonPress}
        onMapPress={onMapPresOutsideOfPolygon}
        onCameraChanged={onCameraChanged}></ZoneMap>

      <AvalancheForecastZoneCards
        key={`${preferredCenterId}-zoneCards`}
        center_id={preferredCenterId}
        date={requestedTime}
        zones={preferredCenterZones}
        selectedZoneId={selectedZoneId}
        setSelectedZoneId={setSelectedZoneId}
        controllerRef={controller}
        bottomOffset={isInNoCenterExperience ? 0 : tabBarHeight}
      />

      <CenterNotSupportedModal visible={unsupportedCenterId !== null} centerId={unsupportedCenterId} onClose={onCloseUnsupportedModal} />
    </>
  );
};
