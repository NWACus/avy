import React, {useCallback, useEffect, useMemo, useRef} from 'react';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {Alert, StyleSheet, useWindowDimensions} from 'react-native';

import {AnimatedDrawerState, AnimatedMapWithDrawerController} from 'components/map/AnimatedCards';
import {MapViewZone, ZoneMap} from 'components/map/ZoneMap';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {Preferences, usePreferences} from 'Preferences';
import {MainStackNavigationProps} from 'routes';
import {AvalancheCenterID, isSupportedCenter} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime} from 'utils/date';

import {Camera, MapState} from '@rnmapbox/maps';
import {defaultMapRegionForGeometries} from 'components/helpers/geographicCoordinates';
import {AvalancheForecastZoneCards} from 'components/map/AvalancheForecastZoneCards';
import {TopElementMeasurments} from 'components/map/AvalancheForecastZoneMap';
import {Position} from 'geojson';
import {merge} from 'lodash';

interface AvalancheForecastMapViewProps {
  preferredCenterId: AvalancheCenterID;
  zones: MapViewZone[];
  requestedTime: RequestedTime;
  isInNoCenterExperience: boolean;
  selectedZoneId: number | null;
  setSelectedZoneId: React.Dispatch<React.SetStateAction<number | null>>;
  bottomTabBarHeight?: number;
  topElementMeasurements?: TopElementMeasurments;
  userLocation?: Position | undefined;
}

export const AvalancheForecastMapView: React.FunctionComponent<AvalancheForecastMapViewProps> = ({
  preferredCenterId,
  zones,
  requestedTime,
  isInNoCenterExperience,
  selectedZoneId,
  setSelectedZoneId,
  bottomTabBarHeight = 0,
  topElementMeasurements = {yPos: 0, height: 0},
  userLocation = undefined,
}: AvalancheForecastMapViewProps) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const {setPreferences} = usePreferences();

  const navigation = useNavigation<MainStackNavigationProps>();

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
          let updatedPreferences: Partial<Preferences> = {};
          let shouldUpdatePreferences = false;

          if (selectedZoneCenter !== preferredCenterId) {
            const centerPreference: Partial<Preferences> = {center: selectedZoneCenter};
            updatedPreferences = merge({}, updatedPreferences, centerPreference);
            shouldUpdatePreferences = true;
          }

          if (isInNoCenterExperience) {
            const noCenterPreference: Partial<Preferences> = {isInNoCenterExperience: false};
            updatedPreferences = merge({}, updatedPreferences, noCenterPreference);
            shouldUpdatePreferences = true;
          }

          if (shouldUpdatePreferences) {
            setPreferences(updatedPreferences);
          }
        } else {
          Alert.alert(`${selectedZoneCenter} is not supported`, `Please go to their website to view the full forecast for ${selectedZoneCenter} or select another center`, [
            {
              text: 'OK',
              onPress: () => {},
            },
            {
              text: 'Go to website',
              onPress: () => {},
            },
          ]);
        }
      }
    },
    [navigation, selectedZoneId, isInNoCenterExperience, preferredCenterId, requestedTime, setSelectedZoneId, setPreferences],
  );

  const preferredCenterZones = useMemo(() => zones.filter(zone => zone.center_id === preferredCenterId), [zones, preferredCenterId]);

  const avalancheCenterMapRegion = useMemo(() => defaultMapRegionForGeometries(preferredCenterZones.map(zone => zone.feature.geometry)), [preferredCenterZones]);

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapCameraRef = useRef<Camera>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapCameraRef, logger));

  const reanimateOnFocus = useCallback(() => {
    controller.current.forceAnimateMapRegion();
  }, [controller]);
  useFocusEffect(reanimateOnFocus);

  React.useEffect(() => {
    controller.current.animateUsingUpdatedAvalancheCenterMapRegion(avalancheCenterMapRegion);
  }, [avalancheCenterMapRegion, controller]);

  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  React.useEffect(() => {
    controller.current.animateUsingUpdatedWindowDimensions(windowWidth, windowHeight);
  }, [windowWidth, windowHeight, controller]);

  React.useEffect(() => {
    controller.current.animateUsingUpdatedTabBarHeight(bottomTabBarHeight);
  }, [bottomTabBarHeight, controller]);

  React.useEffect(() => {
    controller.current.animateUsingUpdatedTopElementsHeight(topElementMeasurements.yPos, topElementMeasurements.height);
  }, [controller, topElementMeasurements]);

  const onCameraChanged = useCallback(
    (mapState: MapState) => {
      if (mapState.gestures.isGestureActive) {
        if (mapState.properties.zoom < 6 && controller.current.state !== AnimatedDrawerState.Hidden) {
          controller.current.setState(AnimatedDrawerState.Hidden, false);
          setSelectedZoneId(null);
        }

        // There's a difference threshold for the no center experience so that the transition between the center focused state and the no center state is smoother
        if (!isInNoCenterExperience && mapState.properties.zoom < 5) {
          setPreferences({isInNoCenterExperience: true});
        }
      }
    },
    [controller, isInNoCenterExperience, setPreferences, setSelectedZoneId],
  );

  useEffect(() => {
    if (userLocation) {
      mapCameraRef.current?.setCamera({centerCoordinate: userLocation, zoomLevel: 7});
    }
  }, [mapCameraRef, userLocation]);

  return (
    <>
      <ZoneMap
        cameraRef={mapCameraRef}
        style={StyleSheet.absoluteFillObject}
        initialCameraBounds={avalancheCenterMapRegion.cameraBounds}
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
        bottomOffset={isInNoCenterExperience ? 0 : bottomTabBarHeight}
      />
    </>
  );
};
