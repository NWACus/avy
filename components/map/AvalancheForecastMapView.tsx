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
import {zoneIdsOverlappingCenter} from 'components/map/zoneOverlap';
import {CBACForecastExplanationModal} from 'components/modals/cbac/CBACForecastExplanationModal';
import {Position} from 'geojson';
import {CenterSwitchOrigin, useAnalytics} from 'hooks/useAnalytics';
import {throttle} from 'lodash';

const CBAC_COVERAGE_CENTER_ID: AvalancheCenterID = 'CBAC';
// The statewide center CBAC's coverage is drawn on top of.
const CBAC_OVERLAPPED_CENTER_ID: AvalancheCenterID = 'CAIC';
// Below this the CBAC zones are small enough that the fixed-size rating pills swamp them. The pills
// hide again a little lower so that a pinch resting on the threshold doesn't thrash them on and off.
const CBAC_RATING_PILL_MIN_ZOOM = 8;
const CBAC_RATING_PILL_HIDE_ZOOM = 7.7;

// onCameraChanged fires once per rendered frame while the camera moves, and rnmapbox offers no native
// throttle. Nothing this handler does needs that resolution.
const CAMERA_CHANGE_THROTTLE_MS = 100;

const NO_TOP_ELEMENTS: TopElementMeasurments = {yPos: 0, height: 0};

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
  topElementMeasurements = NO_TOP_ELEMENTS,
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
  const latestRef = useRef({selectedZoneId, preferredCenterId, requestedTime, zones});
  useEffect(() => {
    latestRef.current = {selectedZoneId, preferredCenterId, requestedTime, zones};
  }, [selectedZoneId, preferredCenterId, requestedTime, zones]);

  // Computed on demand and cached against the zones identity it was built from, like caicCoverageBounds and for
  // the same reason: zones gets a new identity whenever a forecast or warning query settles, and walking CAIC's
  // geometry on each of those would be wasted work. zones is read back out of latestRef rather than closed over
  // so this callback never changes identity and onPolygonPress can depend on it.
  const cbacOverlappedZoneIdsRef = useRef<{zones: MapViewZone[]; zoneIds: Set<number>} | null>(null);
  const cbacOverlappedZoneIds = useCallback((): Set<number> => {
    const currentZones = latestRef.current.zones;
    if (cbacOverlappedZoneIdsRef.current?.zones !== currentZones) {
      cbacOverlappedZoneIdsRef.current = {zones: currentZones, zoneIds: zoneIdsOverlappingCenter(currentZones, CBAC_OVERLAPPED_CENTER_ID, CBAC_COVERAGE_CENTER_ID)};
    }
    return cbacOverlappedZoneIdsRef.current.zoneIds;
  }, []);

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
        } else if (
          selectedZoneCenter === CBAC_OVERLAPPED_CENTER_ID &&
          latest.preferredCenterId === CBAC_COVERAGE_CENTER_ID &&
          !isInNoCenterExperienceRef.current &&
          cbacOverlappedZoneIds().has(zone.zone_id)
        ) {
          // A statewide zone that CBAC's coverage sits on top of. The user already has a local forecast for this
          // ground, so explain the overlap rather than treating CAIC as an unsupported center. Excluded in the
          // no-center experience because this modal's own "Explore both forecasts" is how the user got there.
          // Leave the zone unselected, like the other two modal branches.
          openForecastExplanation();
        } else {
          setUnsupportedCenterId(selectedZoneCenter);
        }
      }
    },
    [navigation, analytics, setSelectedZoneId, setPreferences, setIsInNoCenterExperience, openForecastExplanation, cbacOverlappedZoneIds],
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

  // Computed on demand rather than up front: CAIC is by far the highest-vertex center on the map and
  // this bounding box is only read when the user taps through to its coverage.
  const caicCoverageBoundsRef = useRef<{zones: MapViewZone[]; bounds: CameraBounds | undefined} | null>(null);
  const caicCoverageBounds = useCallback((): CameraBounds | undefined => {
    if (caicCoverageBoundsRef.current?.zones !== zones) {
      const caicZones = zones.filter(zone => zone.center_id === CBAC_OVERLAPPED_CENTER_ID);
      caicCoverageBoundsRef.current = {zones: zones, bounds: caicZones.length > 0 ? defaultMapRegionForZones(caicZones).cameraBounds : undefined};
    }
    return caicCoverageBoundsRef.current.bounds;
  }, [zones]);

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
    (mapState: MapState) => {
      // Guard: with no preferred-center zones the center bounds are degenerate (0,0); skip detection.
      if (!mapState.gestures.isGestureActive || preferredCenterZones.length === 0 || isInNoCenterExperienceRef.current) {
        return;
      }
      // The map fills the whole screen, so trim its bounds to the area not covered by the header and tab bar
      // before testing visibility — otherwise a center hidden behind that chrome would still count as on-screen.
      const visibleViewport = insetViewportBounds(mapState.properties.bounds, {
        topInset: topElementMeasurements.yPos + topElementMeasurements.height,
        bottomInset: tabBarHeight,
        mapHeight: windowHeight,
      });
      if (regionBoundsVisible(avalancheCenterMapRegion.cameraBounds, visibleViewport)) {
        return;
      }
      enterNoCenterExperience();
    },
    [avalancheCenterMapRegion, preferredCenterZones, enterNoCenterExperience, topElementMeasurements, tabBarHeight, windowHeight],
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
    (bounds: CameraBounds) => {
      if (!onCBACCoverageVisibleChange) {
        return;
      }
      // Tested against the raw viewport rather than the inset one: the legend this drives is measured as
      // part of the top elements, so feeding it the inset would let showing the legend hide the legend.
      const cbacVisible = cbacCoverageBounds !== undefined && regionBoundsVisible(cbacCoverageBounds, bounds);
      if (cbacCoverageVisibleRef.current !== cbacVisible) {
        cbacCoverageVisibleRef.current = cbacVisible;
        onCBACCoverageVisibleChange(cbacVisible);
      }
    },
    [cbacCoverageBounds, onCBACCoverageVisibleChange],
  );

  const showCBACRatingPillsRef = useRef(false);
  const reportCBACRatingPillVisibility = useCallback((zoom: number) => {
    const show = showCBACRatingPillsRef.current ? zoom >= CBAC_RATING_PILL_HIDE_ZOOM : zoom >= CBAC_RATING_PILL_MIN_ZOOM;
    if (showCBACRatingPillsRef.current !== show) {
      showCBACRatingPillsRef.current = show;
      setShowCBACRatingPills(show);
    }
  }, []);

  const onCameraMoved = useCallback(
    (mapState: MapState) => {
      enterNoCenterExperienceIfCenterOffscreen(mapState);
      persistCameraWhileCenterless(mapState);
      reportCBACCoverageVisibility(mapState.properties.bounds);
      reportCBACRatingPillVisibility(mapState.properties.zoom);
    },
    [enterNoCenterExperienceIfCenterOffscreen, persistCameraWhileCenterless, reportCBACCoverageVisibility, reportCBACRatingPillVisibility],
  );

  // Read through a ref so the throttled handler never changes identity: it is a prop on the native
  // MapView, and a new one each render would push a prop update down on every render.
  const onCameraMovedRef = useRef(onCameraMoved);
  useEffect(() => {
    onCameraMovedRef.current = onCameraMoved;
  }, [onCameraMoved]);

  const onCameraChanged = useMemo(() => throttle((mapState: MapState) => onCameraMovedRef.current(mapState), CAMERA_CHANGE_THROTTLE_MS, {leading: true, trailing: true}), []);
  useEffect(() => () => onCameraChanged.cancel(), [onCameraChanged]);

  useEffect(() => {
    if (userLocation) {
      // Center on the user's location and re-orient the map to north (heading: 0).
      mapCameraRef.current?.setCamera({centerCoordinate: userLocation, zoomLevel: 7, heading: 0});
    }
  }, [mapCameraRef, userLocation]);

  const showCBACCoverageOnMap = useCallback(() => {
    enterNoCenterExperience();
    const bounds = caicCoverageBounds();
    if (bounds) {
      mapCameraRef.current?.setCamera({bounds: bounds, heading: 0});
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
