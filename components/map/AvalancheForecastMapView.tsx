import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StyleSheet, useWindowDimensions} from 'react-native';

import {AnimatedDrawerState, AnimatedMapWithDrawerController} from 'components/map/AnimatedCards';
import {ZonePolygonStyle} from 'components/map/AvalancheForecastZonePolygon';
import {MapViewZone, ZoneMap} from 'components/map/ZoneMap';
import {CBACForecastCenterlessModal} from 'components/modals/cbac/CBACForecastCenterlessModal';
import {CenterNotSupportedModal} from 'components/modals/CenterNotSupportedModal';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useMapPersistence} from 'MapPersistence';
import {usePreferences} from 'Preferences';
import {MainStackNavigationProps} from 'routes';
import {AvalancheCenterID, isNACCenter} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime} from 'utils/date';

import {Camera, CameraBounds, CameraStop, MapState} from '@rnmapbox/maps';
import {defaultMapRegionForGeometries, defaultMapRegionForZones, insetViewportBounds, regionBoundsVisible} from 'components/helpers/geographicCoordinates';
import {AvalancheForecastZoneCards} from 'components/map/AvalancheForecastZoneCards';
import {TopElementMeasurments} from 'components/map/AvalancheForecastZoneMap';
import {CBACForecastZoneDropdown} from 'components/map/CBACForecastZoneDropdown';
import {CBACOverlappingForecastsLink} from 'components/map/CBACOverlappingForecastsLink';
import {CBACZoneRatingPill} from 'components/map/CBACZoneRatingPill';
import {CBACForecastExplanationModal} from 'components/modals/cbac/CBACForecastExplanationModal';
import {Position} from 'geojson';
import {CenterSwitchOrigin, useAnalytics} from 'hooks/useAnalytics';

const CBAC_COVERAGE_CENTER_ID: AvalancheCenterID = 'CBAC';
// Below this the CBAC zones are small enough that the fixed-size rating pills swamp them.
const CBAC_RATING_PILL_MIN_ZOOM = 8;

interface AvalancheForecastMapViewProps {
  preferredCenterId: AvalancheCenterID;
  zones: MapViewZone[];
  requestedTime: RequestedTime;
  selectedZoneId: number | null;
  tabBarHeight: number;
  setSelectedZoneId: React.Dispatch<React.SetStateAction<number | null>>;
  topElementMeasurements?: TopElementMeasurments;
  userLocation?: Position | undefined;
  onCBACCoverageVisibleChange?: (visible: boolean) => void;
}

export const AvalancheForecastMapView: React.FunctionComponent<AvalancheForecastMapViewProps> = ({
  preferredCenterId,
  zones,
  requestedTime,
  selectedZoneId,
  tabBarHeight,
  setSelectedZoneId,
  topElementMeasurements = {yPos: 0, height: 0},
  userLocation = undefined,
  onCBACCoverageVisibleChange = undefined,
}: AvalancheForecastMapViewProps) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const {setPreferences} = usePreferences();
  const analytics = useAnalytics();
  const {isInNoCenterExperience, setIsInNoCenterExperience, initialMapCamera, saveMapCamera} = useMapPersistence();

  const navigation = useNavigation<MainStackNavigationProps>();

  const [unsupportedCenterId, setUnsupportedCenterId] = useState<AvalancheCenterID | null>(null);
  const onCloseUnsupportedModal = useCallback(() => setUnsupportedCenterId(null), []);

  const [pendingCBACZone, setPendingCBACZone] = useState<MapViewZone | null>(null);
  const onCloseCBACCenterlessModal = useCallback(() => setPendingCBACZone(null), []);

  const [showForecastExplanation, setShowForecastExplanation] = useState(false);
  const openForecastExplanation = useCallback(() => setShowForecastExplanation(true), []);
  const closeForecastExplanation = useCallback(() => setShowForecastExplanation(false), []);

  const onMapPresOutsideOfPolygon = useCallback(
    (_: GeoJSON.Feature) => {
      // Since the polygons are layered on the map, this is only called when the map is tapped outside of a polygon
      setSelectedZoneId(null);
    },
    [setSelectedZoneId],
  );

  // Read through a ref so onPolygonPress stays referentially stable: it is the memo key for every zone
  // polygon, and closing over selectedZoneId would rebuild all of them on each tap.
  const latestRef = useRef({selectedZoneId, preferredCenterId, requestedTime});
  useEffect(() => {
    latestRef.current = {selectedZoneId, preferredCenterId, requestedTime};
  }, [selectedZoneId, preferredCenterId, requestedTime]);

  const onPolygonPress = useCallback(
    (zone: MapViewZone) => {
      const latest = latestRef.current;
      if (latest.selectedZoneId === zone.zone_id) {
        navigation.navigate('forecast', {
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          requestedTime: formatRequestedTime(latest.requestedTime),
        });
      } else {
        const selectedZoneCenter = zone.center_id;
        if (isInNoCenterExperienceRef.current && selectedZoneCenter === CBAC_COVERAGE_CENTER_ID) {
          // Leave the zone unselected so dismissing the modal returns the map to exactly the state it was in
          setPendingCBACZone(zone);
        } else if (isNACCenter(selectedZoneCenter)) {
          setSelectedZoneId(zone.zone_id);

          if (selectedZoneCenter !== latest.preferredCenterId) {
            analytics.captureCenterSwitch(latest.preferredCenterId, selectedZoneCenter, CenterSwitchOrigin.Map);
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
    [navigation, analytics, setSelectedZoneId, setPreferences, setIsInNoCenterExperience],
  );

  const onSwitchToCBAC = useCallback(() => {
    if (!pendingCBACZone) {
      return;
    }
    setSelectedZoneId(pendingCBACZone.zone_id);
    setPreferences({center: CBAC_COVERAGE_CENTER_ID, hasSeenCBACForecastFirstRun: true});
    setIsInNoCenterExperience(false);
    setPendingCBACZone(null);
  }, [pendingCBACZone, setSelectedZoneId, setPreferences, setIsInNoCenterExperience]);

  const zonePolygonStyle = useCallback(
    (zone: MapViewZone): ZonePolygonStyle => {
      if (zone.center_id !== CBAC_COVERAGE_CENTER_ID) {
        return 'default';
      }
      return isInNoCenterExperience ? 'coverageEdge' : 'opaqueFill';
    },
    [isInNoCenterExperience],
  );

  const preferredCenterZones = useMemo(() => zones.filter(zone => zone.center_id === preferredCenterId), [zones, preferredCenterId]);

  const avalancheCenterMapRegion = useMemo(() => defaultMapRegionForGeometries(preferredCenterZones.map(zone => zone.feature.geometry)), [preferredCenterZones]);

  const caicZones = useMemo(() => zones.filter(zone => zone.center_id === 'CAIC'), [zones]);
  const caicCoverageBounds = useMemo(() => (caicZones.length > 0 ? defaultMapRegionForZones(caicZones).cameraBounds : undefined), [caicZones]);
  const cbacZones = useMemo(() => zones.filter(zone => zone.center_id === CBAC_COVERAGE_CENTER_ID), [zones]);
  const cbacCoverageBounds = useMemo(() => (cbacZones.length > 0 ? defaultMapRegionForZones(cbacZones).cameraBounds : undefined), [cbacZones]);
  const cbacCoverageVisibleRef = useRef<boolean | null>(null);
  const [showCBACRatingPills, setShowCBACRatingPills] = useState(false);

  const isInNoCenterExperienceRef = useRef(isInNoCenterExperience);

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapCameraRef = useRef<Camera>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapCameraRef, logger));

  useEffect(() => {
    isInNoCenterExperienceRef.current = isInNoCenterExperience;
    controller.current.shouldSuppressMapCentering(isInNoCenterExperience);
  }, [controller, isInNoCenterExperience]);

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
    controller.current.animateUsingUpdatedTabBarHeight(tabBarHeight);
  }, [tabBarHeight, controller]);

  React.useEffect(() => {
    controller.current.animateUsingUpdatedTopElementsHeight(topElementMeasurements.yPos, topElementMeasurements.height);
  }, [controller, topElementMeasurements]);

  const visibleViewportFor = useCallback(
    (bounds: CameraBounds): CameraBounds =>
      // The map fills the whole screen, so trim its bounds to the area not covered by the header and tab bar
      // before testing visibility — otherwise a region hidden behind that chrome would still count as on-screen.
      insetViewportBounds(bounds, {
        topInset: topElementMeasurements.yPos + topElementMeasurements.height,
        bottomInset: tabBarHeight,
        mapHeight: windowHeight,
      }),
    [topElementMeasurements, tabBarHeight, windowHeight],
  );

  // Hide the cards, clear the selection, and enter the no-center experience together as a single event.
  const enterNoCenterExperience = useCallback(() => {
    if (controller.current.state !== AnimatedDrawerState.Hidden) {
      controller.current.setState(AnimatedDrawerState.Hidden, false);
    }
    setSelectedZoneId(null);
    // Updating the ref here helps prevent unnecessary calls to setIsInNoCenterExperience.
    isInNoCenterExperienceRef.current = true;
    setIsInNoCenterExperience(true);
    // Suppress synchronously so any debounced animateMapRegion already in flight is cancelled before setPreferences schedules a re-render.
    controller.current.shouldSuppressMapCentering(true);
  }, [controller, setIsInNoCenterExperience, setSelectedZoneId]);

  const enterNoCenterExperienceIfCenterOffscreen = useCallback(
    (mapState: MapState, visibleViewport: CameraBounds) => {
      // Guard: with no preferred-center zones the center bounds are degenerate (0,0); skip detection.
      if (!mapState.gestures.isGestureActive || preferredCenterZones.length === 0 || isInNoCenterExperienceRef.current) {
        return;
      }
      if (regionBoundsVisible(avalancheCenterMapRegion.cameraBounds, visibleViewport)) {
        return;
      }
      enterNoCenterExperience();
    },
    [avalancheCenterMapRegion, preferredCenterZones, enterNoCenterExperience],
  );

  const persistCameraWhileCenterless = useCallback(
    (mapState: MapState) => {
      if (isInNoCenterExperienceRef.current) {
        saveMapCamera({
          center: mapState.properties.center as [number, number],
          zoom: mapState.properties.zoom,
        });
      }
    },
    [saveMapCamera],
  );

  const reportCBACCoverageVisibility = useCallback(
    (visibleViewport: CameraBounds) => {
      if (!onCBACCoverageVisibleChange) {
        return;
      }
      // onCameraChanged fires continuously while panning, so only report an actual flip.
      const cbacVisible = cbacCoverageBounds !== undefined && regionBoundsVisible(cbacCoverageBounds, visibleViewport);
      if (cbacCoverageVisibleRef.current !== cbacVisible) {
        cbacCoverageVisibleRef.current = cbacVisible;
        onCBACCoverageVisibleChange(cbacVisible);
      }
    },
    [cbacCoverageBounds, onCBACCoverageVisibleChange],
  );

  const onCameraChanged = useCallback(
    (mapState: MapState) => {
      const visibleViewport = visibleViewportFor(mapState.properties.bounds);
      enterNoCenterExperienceIfCenterOffscreen(mapState, visibleViewport);
      persistCameraWhileCenterless(mapState);
      reportCBACCoverageVisibility(visibleViewport);
      setShowCBACRatingPills(mapState.properties.zoom >= CBAC_RATING_PILL_MIN_ZOOM);
    },
    [visibleViewportFor, enterNoCenterExperienceIfCenterOffscreen, persistCameraWhileCenterless, reportCBACCoverageVisibility],
  );

  useEffect(() => {
    if (userLocation) {
      // Center on the user's location and re-orient the map to north (heading: 0).
      mapCameraRef.current?.setCamera({centerCoordinate: userLocation, zoomLevel: 7, heading: 0});
    }
  }, [mapCameraRef, userLocation]);

  const showCBACCoverageOnMap = useCallback(() => {
    enterNoCenterExperience();
    if (caicCoverageBounds) {
      mapCameraRef.current?.setCamera({bounds: caicCoverageBounds, heading: 0});
    }
  }, [enterNoCenterExperience, caicCoverageBounds]);

  const onExploreBothForecasts = useCallback(() => {
    setShowForecastExplanation(false);
    showCBACCoverageOnMap();
  }, [showCBACCoverageOnMap]);

  const renderCBACHeaderAccessory = useCallback(
    (zone: MapViewZone) => <CBACForecastZoneDropdown zone={zone} onSeeAreaOnMap={showCBACCoverageOnMap} onShowExplanation={openForecastExplanation} />,
    [showCBACCoverageOnMap, openForecastExplanation],
  );

  const renderCBACFooter = useCallback(() => <CBACOverlappingForecastsLink onPress={openForecastExplanation} />, [openForecastExplanation]);

  const isCBACSelected = preferredCenterId === CBAC_COVERAGE_CENTER_ID;

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
        style={StyleSheet.absoluteFill}
        initialCameraBounds={avalancheCenterMapRegion.cameraBounds}
        initialCameraStop={initialCameraStop}
        zones={zones}
        selectedZoneId={selectedZoneId}
        zonePolygonStyle={zonePolygonStyle}
        onPolygonPress={onPolygonPress}
        onMapPress={onMapPresOutsideOfPolygon}
        onCameraChanged={onCameraChanged}>
        {isInNoCenterExperience && showCBACRatingPills && cbacZones.map(zone => <CBACZoneRatingPill key={`${zone.zone_id}-ratingPill`} zone={zone} />)}
      </ZoneMap>

      <AvalancheForecastZoneCards
        key={`${preferredCenterId}-zoneCards`}
        center_id={preferredCenterId}
        date={requestedTime}
        zones={preferredCenterZones}
        selectedZoneId={selectedZoneId}
        setSelectedZoneId={setSelectedZoneId}
        controllerRef={controller}
        bottomOffset={isInNoCenterExperience ? 0 : tabBarHeight}
        renderHeaderAccessory={isCBACSelected ? renderCBACHeaderAccessory : undefined}
        renderFooter={isCBACSelected ? renderCBACFooter : undefined}
      />

      <CenterNotSupportedModal visible={unsupportedCenterId !== null} centerId={unsupportedCenterId} onClose={onCloseUnsupportedModal} />

      <CBACForecastCenterlessModal visible={pendingCBACZone !== null} onClose={onCloseCBACCenterlessModal} onSwitchToCBAC={onSwitchToCBAC} />

      <CBACForecastExplanationModal visible={showForecastExplanation} onClose={closeForecastExplanation} onExploreBoth={onExploreBothForecasts} />
    </>
  );
};
