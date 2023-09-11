import React, {RefObject, useCallback, useRef, useState} from 'react';

import {useNavigation} from '@react-navigation/native';
import {
  Animated,
  FlatList,
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View as RNView,
} from 'react-native';
import AnimatedMapView, {Region} from 'react-native-maps';

import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {Logger} from 'browser-bunyan';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {defaultMapRegionForGeometries, MapViewZone, ZoneMap} from 'components/content/ZoneMap';
import {HStack, View, VStack} from 'components/core';
import {DangerScale} from 'components/DangerScale';
import {TravelAdvice} from 'components/helpers/travelAdvice';
import {BodySm, BodySmSemibold, Title3Black} from 'components/text';
import {add, isAfter} from 'date-fns';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {useMapLayerAvalancheForecasts} from 'hooks/useMapLayerAvalancheForecasts';
import {useMapLayerAvalancheWarnings} from 'hooks/useMapLayerAvalancheWarnings';
import {LoggerContext, LoggerProps} from 'loggerContext';
import md5 from 'md5';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HomeStackNavigationProps} from 'routes';
import {AvalancheCenterID, DangerLevel, ForecastPeriod, MapLayerFeature, ProductType} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime, toISOStringUTC, utcDateToLocalTimeString} from 'utils/date';

export interface MapProps {
  center: AvalancheCenterID;
  requestedTime: RequestedTime;
}

export const AvalancheForecastZoneMap: React.FunctionComponent<MapProps> = ({center, requestedTime}: MapProps) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const mapLayerResult = useMapLayer(center);
  const mapLayer = mapLayerResult.data;
  const metadataResult = useAvalancheCenterMetadata(center);
  const metadata = metadataResult.data;
  const forecastResults = useMapLayerAvalancheForecasts(center, requestedTime, mapLayer, metadata);
  const warningResults = useMapLayerAvalancheWarnings(center, requestedTime, mapLayer);

  const topElements = React.useRef<RNView>(null);

  const navigation = useNavigation<HomeStackNavigationProps>();
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const onPressMapView = useCallback(() => {
    setSelectedZoneId(null);
  }, []);
  const onPressPolygon = useCallback(
    (zone: MapViewZone) => {
      if (selectedZoneId === zone.zone_id) {
        navigation.navigate('forecast', {
          zoneName: zone.name,
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          requestedTime: formatRequestedTime(requestedTime),
        });
      } else {
        setSelectedZoneId(zone.zone_id);
      }
    },
    [navigation, selectedZoneId, requestedTime],
  );

  const avalancheCenterMapRegion: Region = defaultMapRegionForGeometries(mapLayer?.features.map(feature => feature.geometry));

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapView = useRef<AnimatedMapView>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapView, logger)).current;
  React.useEffect(() => {
    controller.animateUsingUpdatedAvalancheCenterMapRegion(avalancheCenterMapRegion);
  }, [avalancheCenterMapRegion, controller]);

  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  React.useEffect(() => {
    controller.animateUsingUpdatedWindowDimensions(windowWidth, windowHeight);
  }, [windowWidth, windowHeight, controller]);

  const tabBarHeight = useBottomTabBarHeight();
  React.useEffect(() => {
    controller.animateUsingUpdatedTabBarHeight(tabBarHeight);
  }, [tabBarHeight, controller]);

  if (incompleteQueryState(mapLayerResult, metadataResult, ...forecastResults, ...warningResults) || !mapLayer || !metadata) {
    return <QueryState results={[mapLayerResult, metadataResult, ...forecastResults, ...warningResults]} />;
  }

  // default to the values in the map layer, but update it with the forecasts and wranings we've fetched
  const zonesById: Record<string, MapViewZone> = mapLayer.features.reduce((accum: Record<string, MapViewZone>, feature: MapLayerFeature) => {
    accum[feature.id] = {
      zone_id: feature.id,
      geometry: feature.geometry,
      hasWarning: feature.properties.warning.product !== null,
      center_id: center,
      name: feature.properties.name,
      danger_level: feature.properties.danger_level,
      start_date: feature.properties.start_date,
      end_date: feature.properties.end_date,
      fillOpacity: feature.properties.fillOpacity,
    };
    return accum;
  }, {});
  forecastResults
    .map(result => result.data) // get data from the results
    .filter(data => data) // only operate on results that have succeeded
    .forEach(forecast => {
      forecast &&
        forecast.forecast_zone?.forEach(({id}) => {
          const mapViewZoneData = zonesById[id];
          if (mapViewZoneData) {
            if (forecast.product_type === ProductType.Forecast) {
              const currentDanger = forecast.danger.find(d => d.valid_day === ForecastPeriod.Current);
              if (currentDanger) {
                mapViewZoneData.danger_level = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper) as DangerLevel;
              }
            }
            mapViewZoneData.start_date = forecast.published_time;
            mapViewZoneData.end_date = forecast.expires_time;
          }
        });
    });
  warningResults
    .map(result => result.data) // get data from the results
    .forEach(warning => {
      if (!warning) {
        return;
      }
      const mapViewZoneData = zonesById[warning.zone_id];
      if (mapViewZoneData && warning.data.expires_time) {
        mapViewZoneData.hasWarning = true;
      }
    });
  const zones = Object.keys(zonesById).map(k => zonesById[k]);

  return (
    <>
      <ZoneMap
        ref={mapView}
        animated
        style={StyleSheet.absoluteFillObject}
        zoomEnabled={true}
        scrollEnabled={true}
        initialRegion={avalancheCenterMapRegion}
        onPress={onPressMapView}
        zones={zones}
        selectedZoneId={selectedZoneId}
        onPressPolygon={onPressPolygon}
      />
      <SafeAreaView>
        <View>
          <VStack
            ref={topElements}
            width="100%"
            position="absolute"
            top={0}
            left={0}
            right={0}
            mt={8}
            px={4}
            flex={1}
            onLayout={(event: LayoutChangeEvent) => {
              // onLayout returns position relative to parent - we need position relative to screen
              event.currentTarget.measureInWindow((x, y, width, height) => {
                controller.animateUsingUpdatedTopElementsHeight(y, height);
              });

              // we seem to see races between onLayout firing and the measureInWindow picking up the correct
              // SafeAreaView bounds, so let's queue up another render pass in the future to hopefully converge
              setTimeout(() => {
                if (topElements.current) {
                  topElements.current.measureInWindow((x, y, width, height) => {
                    controller.animateUsingUpdatedTopElementsHeight(y, height);
                  });
                }
              }, 50);
            }}>
            <DangerScale width="100%" />
          </VStack>
        </View>
      </SafeAreaView>

      <AvalancheForecastZoneCards key={center} date={requestedTime} zones={zones} selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId} controller={controller} />
    </>
  );
};

export const CARD_WIDTH = 0.9; // proportion of overall width that one card takes up
export const CARD_WHITESPACE = (1 - CARD_WIDTH) / 2; // proportion of overall width that the spacing between cards takes up on the screen
export const CARD_SPACING = CARD_WHITESPACE / 2; // proportion of overall width that the spacing between two cards takes up
export const CARD_MARGIN = CARD_SPACING / 2; // proportion of overall width that each card needs as a margin

enum AnimatedDrawerState {
  Hidden = 'Hidden',
  Docked = 'Docked',
  Visible = 'Visible',
}

class AnimatedMapWithDrawerController {
  // These offsets are applied through translateY on the FlatList drawer
  static readonly OFFSETS = {
    [AnimatedDrawerState.Hidden]: 240,
    [AnimatedDrawerState.Docked]: 155,
    [AnimatedDrawerState.Visible]: 0,
  };

  // When a pan gesture goes beyond this distance, we animate the drawer to the final state
  static readonly SNAP_THRESHOLD = 16;

  logger: Logger;

  // The following members manage the state of the drawer at the bottom of the map
  state: AnimatedDrawerState;
  baseOffset: number;
  panning: boolean;
  yOffset: Animated.Value;

  // The following members determine the map's region
  baseAvalancheCenterMapRegion: Region;
  windowWidth = 0;
  windowHeight = 0;
  topElementsOffset = 0;
  topElementsHeight = 0;
  cardDrawerMaximumHeight = 0;
  tabBarHeight = 0;
  mapView: RefObject<AnimatedMapView>;
  // We store the last time we logged a region calculation so as to continue logging but not spam
  lastLogged: Record<string, string>; // mapping hash of parameters to the time we last logged it

  constructor(state = AnimatedDrawerState.Docked, region: Region, mapView: RefObject<AnimatedMapView>, logger: Logger) {
    this.logger = logger;
    this.state = state;
    this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[state];
    this.panning = false;
    this.yOffset = new Animated.Value(this.baseOffset);
    this.baseAvalancheCenterMapRegion = region;
    this.mapView = mapView;
    this.lastLogged = {};
  }

  setState(state: AnimatedDrawerState) {
    this.state = state;
    this.panning = false;
    this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[state];
    this.yOffset.flattenOffset();
    this.animateMapRegion();
    Animated.spring(this.yOffset, {toValue: this.baseOffset, useNativeDriver: true}).start();
  }

  onPanResponderGrant() {
    this.panning = true;
    this.yOffset.setOffset(this.baseOffset);
    this.yOffset.setValue(0);
  }

  onPanResponderMove(event: GestureResponderEvent, gestureState: PanResponderGestureState) {
    if (!this.panning) {
      return;
    }

    // Are we moving too far in the X direction? If so, treat as a scroll and stop panning the drawer
    if (Math.abs(gestureState.dx) > AnimatedMapWithDrawerController.SNAP_THRESHOLD) {
      this.onPanResponderRelease();
      return;
    }

    // Detect overscroll in the invalid direction - we allow a little bit of give,
    // but then ignore the events
    if (
      (this.state === AnimatedDrawerState.Docked && gestureState.dy > AnimatedMapWithDrawerController.SNAP_THRESHOLD) ||
      (this.state === AnimatedDrawerState.Visible && gestureState.dy < -AnimatedMapWithDrawerController.SNAP_THRESHOLD)
    ) {
      return;
    }

    if (Math.abs(gestureState.dy) > AnimatedMapWithDrawerController.SNAP_THRESHOLD) {
      this.panning = false;
      this.state = this.state === AnimatedDrawerState.Docked ? AnimatedDrawerState.Visible : AnimatedDrawerState.Docked;
      this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[this.state];
      this.yOffset.flattenOffset();
      this.animateMapRegion();
      Animated.spring(this.yOffset, {toValue: this.baseOffset, useNativeDriver: true}).start();
    } else {
      Animated.event([null, {dy: this.yOffset}], {useNativeDriver: false})(event, gestureState);
    }
  }

  onPanResponderRelease() {
    if (this.panning) {
      // user panned, but not far enough to change state - we should spring back to our previous position
      this.panning = false;
      this.yOffset.flattenOffset();
      Animated.spring(this.yOffset, {toValue: this.baseOffset, useNativeDriver: true}).start();
    }
    this.panning = false;
  }

  getTransform() {
    const allowedRange = [
      AnimatedMapWithDrawerController.OFFSETS[AnimatedDrawerState.Visible] - AnimatedMapWithDrawerController.SNAP_THRESHOLD,
      AnimatedMapWithDrawerController.OFFSETS[AnimatedDrawerState.Hidden] + AnimatedMapWithDrawerController.SNAP_THRESHOLD,
    ];
    return {
      translateY: this.yOffset.interpolate({
        inputRange: allowedRange,
        outputRange: allowedRange,
        extrapolate: 'clamp',
      }),
    };
  }

  animateUsingUpdatedCardDrawerMaximumHeight(height: number) {
    this.cardDrawerMaximumHeight = height;
    this.animateMapRegion();
  }

  animateUsingUpdatedTopElementsHeight(offset: number, height: number) {
    this.topElementsOffset = offset;
    this.topElementsHeight = height;
    this.animateMapRegion();
  }

  animateUsingUpdatedTabBarHeight(height: number) {
    this.tabBarHeight = height;
    this.animateMapRegion();
  }

  animateUsingUpdatedWindowDimensions(width: number, height: number) {
    this.windowHeight = height;
    this.windowWidth = width;
    this.animateMapRegion();
  }

  animateUsingUpdatedAvalancheCenterMapRegion(avalancheCenterMapRegion: Region) {
    this.baseAvalancheCenterMapRegion = avalancheCenterMapRegion;
    this.animateMapRegion();
  }

  private animateMapRegion() {
    const cardDrawerHeight = Math.max(0, this.cardDrawerMaximumHeight - this.baseOffset); // negative when hidden
    // then, we need to look at the entire available screen real-estate for our app
    // to determine the unobstructed area for the polygons
    const unobstructedWidth = this.windowWidth;
    const unobstructedHeight = this.windowHeight - this.topElementsOffset - this.topElementsHeight - cardDrawerHeight - this.tabBarHeight;

    // nb. in spherical projections, the scale factor is proportional to the secant of the latitude
    const projectionConversionFactor = (latitudeDegrees: number): number => {
      return 1 / Math.cos((latitudeDegrees * Math.PI) / 180);
    };

    // next, we need to figure out if our constraining behavior is fitting the polygons in width-wise, or height-wise
    // by comparing the aspect ratios of our bounding region and the unobstructed view.
    const regionAspectRatio =
      this.baseAvalancheCenterMapRegion.longitudeDelta / (projectionConversionFactor(this.baseAvalancheCenterMapRegion.latitude) * this.baseAvalancheCenterMapRegion.latitudeDelta);
    const viewAspectRatio = unobstructedWidth / unobstructedHeight;

    // next, we determine the conversion factor between pixels and geographic coordinate degrees
    let degreesPerPixelHorizontally = 0;
    let degreesPerPixelVertically = 0;
    if (regionAspectRatio > viewAspectRatio) {
      // our region is wider than our view, so width is our limiting factor
      degreesPerPixelHorizontally = this.baseAvalancheCenterMapRegion.longitudeDelta / unobstructedWidth;
      degreesPerPixelVertically = degreesPerPixelHorizontally / projectionConversionFactor(this.baseAvalancheCenterMapRegion.latitude);
    } else {
      // our region is taller than our view, so height is our limiting factor
      degreesPerPixelVertically = this.baseAvalancheCenterMapRegion.latitudeDelta / unobstructedHeight;
      degreesPerPixelHorizontally = degreesPerPixelVertically * projectionConversionFactor(this.baseAvalancheCenterMapRegion.latitude);
    }

    // knowing these conversion factors, we can calculate the size of the bounded region in the view
    const regionWidthPixels = this.baseAvalancheCenterMapRegion.longitudeDelta / degreesPerPixelHorizontally;
    const regionHeightPixels = this.baseAvalancheCenterMapRegion.latitudeDelta / degreesPerPixelVertically;

    // then, we can determine the location of the center of the bounded region in the view
    // the center in X will be:
    const regionCenterXPixel =
      regionWidthPixels / 2 + // half the size of the region
      (this.windowWidth - regionWidthPixels) / 2; // half of the leftover space in the screen
    // the center in Y will be:
    const regionCenterYPixel =
      this.topElementsOffset +
      this.topElementsHeight + // the top elements
      regionHeightPixels / 2 + // half the size of the region
      (this.windowHeight - this.topElementsOffset - this.topElementsHeight - cardDrawerHeight - this.tabBarHeight - regionHeightPixels) / 2; // half the leftover space in the screen
    // finally, we calculate the offset, in pixels, from the center of the region to the center of the screen
    const regionCenterXOffsetPixels = regionCenterXPixel - this.windowWidth / 2;
    const regionCenterYOffsetPixels = regionCenterYPixel - this.windowHeight / 2;

    // now, we can position our region relative to our overlays by asking the displayed region to:
    // - center around the virtual point that results in the correct layout
    // - contain enough longitude and latitude deltas to match the whole screen
    const displayedRegion: Region = {
      latitude: this.baseAvalancheCenterMapRegion.latitude + regionCenterYOffsetPixels * degreesPerPixelVertically,
      latitudeDelta: this.windowHeight * degreesPerPixelVertically,

      longitude: this.baseAvalancheCenterMapRegion.longitude + regionCenterXOffsetPixels * degreesPerPixelHorizontally,
      longitudeDelta: this.windowWidth * degreesPerPixelHorizontally,
    };

    // we will get asked to animate a couple of times before the layout settles, at which point we don't have all
    // the parameters we need to calculate the real region to animate to; for those passes through this function
    // we can't animate to this computed displayed region as we'll have NaNs inside, etc
    let targetRegion: Region;
    if (degreesPerPixelVertically > 0 && degreesPerPixelHorizontally > 0) {
      targetRegion = displayedRegion;
    } else {
      targetRegion = this.baseAvalancheCenterMapRegion;
    }
    if (isNaN(targetRegion.latitude) || isNaN(targetRegion.longitude) || isNaN(targetRegion.latitudeDelta) || isNaN(targetRegion.longitudeDelta)) {
      return;
    }
    const parameters = {
      inputs: {
        baseAvalancheCenterMapRegion: this.baseAvalancheCenterMapRegion,
        windowWidth: this.windowWidth,
        windowHeight: this.windowHeight,
        topElementsHeight: this.topElementsHeight,
        topElementsOffset: this.topElementsOffset,
        cardDrawerMaximumHeight: this.cardDrawerMaximumHeight,
        tabBarHeight: this.tabBarHeight,
        baseOffset: this.baseOffset,
      },
      output: targetRegion,
    };
    const parameterHash = md5(JSON.stringify(parameters));
    const now = new Date();
    if (!this.lastLogged[parameterHash] || isAfter(now, add(new Date(this.lastLogged[parameterHash]), {minutes: 1}))) {
      // we have either not seen this input yet, or the last time we saw it was sufficiently long ago
      this.logger.info(parameters, 'animating map region');
      this.lastLogged[parameterHash] = toISOStringUTC(now);
    }
    this.mapView?.current?.animateToRegion(targetRegion);
  }
}

const AvalancheForecastZoneCards: React.FunctionComponent<{
  date: RequestedTime;
  zones: MapViewZone[];
  selectedZoneId: number | null;
  setSelectedZoneId: React.Dispatch<React.SetStateAction<number | null>>;
  controller: AnimatedMapWithDrawerController;
}> = ({date, zones, selectedZoneId, setSelectedZoneId, controller}) => {
  const {width} = useWindowDimensions();

  const [previousSelectedZoneId, setPreviousSelectedZoneId] = useState<number | null>(null);
  const [programaticallyScrolling, setProgramaticallyScrolling] = useState<boolean>(false);
  const [userScrolling, setUserScrolling] = useState<boolean>(false);

  const offsets = zones?.map((_itemData, index) => index * CARD_WIDTH * width + (index - 1) * CARD_SPACING * width);
  const flatListProps = {
    snapToAlignment: 'start',
    decelerationRate: 'fast',
    snapToOffsets: offsets,
    contentInset: {
      left: CARD_MARGIN * width,
      right: CARD_MARGIN * width,
    },
    contentContainerStyle: {paddingHorizontal: CARD_MARGIN * width},
  } as const;

  // The list view has drawer-like behavior - it can be swiped into view, or swiped away.
  // These values control the state that's driven through gestures & animation.
  if (selectedZoneId && controller.state !== AnimatedDrawerState.Visible) {
    controller.setState(AnimatedDrawerState.Visible);
  } else if (!selectedZoneId && controller.state === AnimatedDrawerState.Visible) {
    controller.setState(AnimatedDrawerState.Docked);
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, {dx, dy}) => dx > 0 || dy > 0,
      onPanResponderGrant: () => controller.onPanResponderGrant(),
      onPanResponderMove: (e, gestureState) => controller.onPanResponderMove(e, gestureState),
      onPanResponderRelease: () => controller.onPanResponderRelease(),
    }),
  ).current;

  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!offsets || offsets.length === 0) {
      return;
    }
    // we want to figure out what card the user scrolled to - so, we can figure out which card
    // offset the center of the screen is at; by moving through the list backwards we can simply
    // exit when we find an offset that's before the center of the screen (we know since we got
    // that far in the iteration that the offset prior to that is on the other side of the center
    // of the screen)
    let index = 0;
    const offset = event.nativeEvent.contentOffset.x + width / 2;
    for (let i = offsets.length - 1; i >= 0; i--) {
      if (offsets[i] <= offset) {
        index = i;
        break;
      }
    }
    if (programaticallyScrolling) {
      // when we're scrolling through the list programatically, the true state of the selection is
      // the intended scroll target, not whichever card happens to be shown at the moment
      const intendedIndex = zones.findIndex(z => z.zone_id === selectedZoneId);
      if (intendedIndex === index) {
        // when the programmatic scroll reaches the intended index, we can call this programmatic
        // scroll event finished
        setProgramaticallyScrolling(false);
      }
    } else if (userScrolling) {
      // if the *user* is scrolling this drawer, though, the true state of our selection is up to them
      setSelectedZoneId(zones[index].zone_id);
    }
  };

  if (selectedZoneId !== previousSelectedZoneId) {
    if (selectedZoneId && flatListRef.current) {
      const index = zones.findIndex(z => z.zone_id === selectedZoneId);
      setProgramaticallyScrolling(true);
      flatListRef.current.scrollToIndex({index, animated: true, viewPosition: 0.5});
    }
    setPreviousSelectedZoneId(selectedZoneId);
  }

  return (
    <Animated.FlatList
      onLayout={(event: LayoutChangeEvent) => controller.animateUsingUpdatedCardDrawerMaximumHeight(event.nativeEvent.layout.height)}
      ref={flatListRef}
      horizontal
      style={[
        {
          position: 'absolute',
          width: '100%',
          bottom: 6,
          transform: [controller.getTransform()],
        },
      ]}
      onScroll={handleScroll}
      scrollEventThrottle={200}
      onMomentumScrollBegin={() => setUserScrolling(true)}
      onMomentumScrollEnd={() => setUserScrolling(false)}
      onScrollBeginDrag={() => setUserScrolling(true)}
      onScrollEndDrag={() => setUserScrolling(false)}
      {...panResponder.panHandlers}
      {...flatListProps}
      data={zones.map(zone => ({key: zone.zone_id, zone, date}))}
      renderItem={({item}) => <AvalancheForecastZoneCard {...item} />}
    />
  );
};

const AvalancheForecastZoneCard: React.FunctionComponent<{
  date: RequestedTime;
  zone: MapViewZone;
}> = React.memo(({date, zone}: {date: RequestedTime; zone: MapViewZone}) => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation<HomeStackNavigationProps>();

  const dangerLevel = zone.danger_level ?? DangerLevel.None;
  const dangerColor = colorFor(dangerLevel);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        navigation.navigate('forecast', {
          zoneName: zone.name,
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          requestedTime: formatRequestedTime(date),
        });
      }}>
      <VStack borderRadius={8} bg="white" width={width * CARD_WIDTH} mx={CARD_MARGIN * width} height={'100%'}>
        <View height={8} width="100%" bg={dangerColor.string()} borderTopLeftRadius={8} borderTopRightRadius={8} pb={0} />
        <VStack px={24} pt={4} pb={12} space={8}>
          <HStack space={8} alignItems="center">
            <AvalancheDangerIcon style={{height: 32}} level={dangerLevel} />
            <DangerLevelTitle dangerLevel={dangerLevel} />
          </HStack>
          <Title3Black>{zone.name}</Title3Black>
          <VStack py={8}>
            <Text>
              <BodySm>Published: </BodySm>
              <BodySm>{utcDateToLocalTimeString(zone.start_date)}</BodySm>
              {'\n'}
              <BodySm>Expires: </BodySm>
              <BodySm>{utcDateToLocalTimeString(zone.end_date)}</BodySm>
            </Text>
          </VStack>
          <Text>
            <BodySm>Travel advice: </BodySm>
            <TravelAdvice dangerLevel={dangerLevel} HeadingText={BodySm} BodyText={BodySm} />
          </Text>
        </VStack>
      </VStack>
    </TouchableOpacity>
  );
});
AvalancheForecastZoneCard.displayName = 'AvalancheForecastZoneCard';

const DangerLevelTitle: React.FunctionComponent<{
  dangerLevel: DangerLevel;
}> = ({dangerLevel}) => {
  switch (dangerLevel) {
    case DangerLevel.GeneralInformation:
      return (
        <BodySmSemibold>
          <Text style={{textTransform: 'capitalize'}}>General Information</Text>
        </BodySmSemibold>
      );
    case DangerLevel.None:
      return (
        <BodySmSemibold>
          <Text style={{textTransform: 'capitalize'}}>None</Text>
        </BodySmSemibold>
      );
    case DangerLevel.Low:
    case DangerLevel.Moderate:
    case DangerLevel.Considerable:
    case DangerLevel.High:
    case DangerLevel.Extreme:
      return (
        <BodySmSemibold>
          {dangerLevel} - <Text style={{textTransform: 'capitalize'}}>{DangerLevel[dangerLevel]}</Text> Avalanche Danger
        </BodySmSemibold>
      );
  }
  const invalid: never = dangerLevel;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown danger level: ${invalid}`);
};
