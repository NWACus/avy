import React, {MutableRefObject, useCallback, useRef, useState} from 'react';

import {useNavigation} from '@react-navigation/native';
import {
  ActivityIndicator,
  Animated,
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
} from 'react-native';
import AnimatedMapView, {Region} from 'react-native-maps';

import {FontAwesome5} from '@expo/vector-icons';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {defaultMapRegionForZones, ZoneMap} from 'components/content/ZoneMap';
import {Center, HStack, View, VStack} from 'components/core';
import {DangerScale} from 'components/DangerScale';
import {TravelAdvice} from 'components/helpers/travelAdvice';
import {PlacesSearchBar} from 'components/map/PlacesSearchBar';
import {Body, BodySmSemibold, Caption1, Caption1Black, Title3Black} from 'components/text';
import {MapViewZone, useMapViewZones} from 'hooks/useMapViewZones';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HomeStackNavigationProps} from 'routes';
import {COLORS} from 'theme/colors';
import {AvalancheCenterID, DangerLevel} from 'types/nationalAvalancheCenter';
import {toISOStringUTC, utcDateToLocalTimeString} from 'utils/date';

export interface MapProps {
  center: AvalancheCenterID;
  date: Date;
}

export const AvalancheForecastZoneMap: React.FunctionComponent<MapProps> = ({center, date}: MapProps) => {
  const {isLoading, isError, data: zones} = useMapViewZones(center, date);

  const navigation = useNavigation<HomeStackNavigationProps>();
  const [selectedZone, setSelectedZone] = useState<MapViewZone | null>(null);
  const onPressMapView = useCallback(() => {
    setSelectedZone(null);
  }, []);
  const onPressPolygon = useCallback(
    (zone: MapViewZone) => {
      if (selectedZone === zone) {
        navigation.navigate('forecast', {
          zoneName: zone.name,
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          dateString: toISOStringUTC(date),
        });
      } else {
        setSelectedZone(zone);
      }
    },
    [navigation, selectedZone, date],
  );

  const avalancheCenterMapRegion: Region = defaultMapRegionForZones(zones);

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapView = useRef<AnimatedMapView>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapView)).current;
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
        selectedZone={selectedZone}
        onPressPolygon={onPressPolygon}
      />
      <SafeAreaView>
        <View>
          <VStack
            width="100%"
            position="absolute"
            flex={1}
            onLayout={(event: LayoutChangeEvent) => {
              // onLayout returns position relative to parent - we need position relative to screen
              event.currentTarget.measureInWindow((x, y, width, height) => {
                controller.animateUsingUpdatedTopElementsHeight(y + height);
              });
            }}>
            <View height={12} />
            <PlacesSearchBar px={24} />
            <View height={8} />
            <DangerScale px={4} width="100%" />
          </VStack>
        </View>
      </SafeAreaView>

      {isLoading && (
        <Center width="100%" height="100%" position="absolute" top={0}>
          <ActivityIndicator size={'large'} />
        </Center>
      )}
      {isError && (
        <Center width="100%" position="absolute" bottom={6}>
          <VStack space={8}>
            <Center bg={COLORS['warning.200']} px={24} py={16} borderRadius={4}>
              <HStack space={8} flexShrink={1}>
                <FontAwesome5 name="exclamation-triangle" size={16} color={COLORS['warning.700']} />
                <Body>Unable to load forecast data</Body>
              </HStack>
            </Center>
          </VStack>
        </Center>
      )}
      {!isLoading && !isError && (
        <AvalancheForecastZoneCards key={center} date={date} zones={zones} selectedZone={selectedZone} setSelectedZone={setSelectedZone} controller={controller} />
      )}
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
    [AnimatedDrawerState.Hidden]: 220,
    [AnimatedDrawerState.Docked]: 120,
    [AnimatedDrawerState.Visible]: 0,
  };

  // When a pan gesture goes beyond this distance, we animate the drawer to the final state
  static readonly SNAP_THRESHOLD = 16;

  // The following members manage the state of the drawer at the bottom of the map
  state: AnimatedDrawerState;
  baseOffset: number;
  panning: boolean;
  yOffset: Animated.Value;

  // The following members determine the map's region
  baseAvalancheCenterMapRegion: Region;
  windowWidth: number;
  windowHeight: number;
  topElementsHeight: number;
  cardDrawerMaximumHeight: number;
  tabBarHeight: number;
  mapView: MutableRefObject<AnimatedMapView>;

  constructor(state = AnimatedDrawerState.Docked, region: Region, mapView: MutableRefObject<AnimatedMapView>) {
    this.state = state;
    this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[state];
    this.panning = false;
    this.yOffset = new Animated.Value(this.baseOffset);
    this.baseAvalancheCenterMapRegion = region;
    this.mapView = mapView;
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

  animateUsingUpdatedTopElementsHeight(height: number) {
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
    const unobstructedHeight = this.windowHeight - this.topElementsHeight - cardDrawerHeight - this.tabBarHeight;

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
      this.topElementsHeight + // the top elements
      regionHeightPixels / 2 + // half the size of the region
      (this.windowHeight - this.topElementsHeight - cardDrawerHeight - this.tabBarHeight - regionHeightPixels) / 2; // half the leftover space in the screen
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
    if (degreesPerPixelVertically > 0 && degreesPerPixelHorizontally > 0) {
      this.mapView?.current?.animateToRegion(displayedRegion);
    } else {
      this.mapView?.current?.animateToRegion(this.baseAvalancheCenterMapRegion);
    }
  }
}

const AvalancheForecastZoneCards: React.FunctionComponent<{
  date: Date;
  zones: MapViewZone[];
  selectedZone: MapViewZone | null;
  setSelectedZone: React.Dispatch<React.SetStateAction<MapViewZone>>;
  controller: AnimatedMapWithDrawerController;
}> = ({date, zones, selectedZone, setSelectedZone, controller}) => {
  const {width} = useWindowDimensions();

  const [previousSelectedZone, setPreviousSelectedZone] = useState<MapViewZone | null>(null);
  const [programaticallyScrolling, setProgramaticallyScrolling] = useState<boolean>(false);

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
  if (selectedZone && controller.state !== AnimatedDrawerState.Visible) {
    controller.setState(AnimatedDrawerState.Visible);
  } else if (!selectedZone && controller.state === AnimatedDrawerState.Visible) {
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

  const flatListRef = useRef(null);

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
      const intendedIndex = zones.findIndex(z => z.zone_id === selectedZone.zone_id);
      if (intendedIndex === index) {
        // when the programmatic scroll reaches the intended index, we can call this programmatic
        // scroll event finished
        setProgramaticallyScrolling(false);
      }
    } else {
      // if the *user* is scrolling this drawer, though, the true state of our selection is up to them
      setSelectedZone(zones[index]);
    }
  };

  if (selectedZone !== previousSelectedZone) {
    if (selectedZone) {
      const index = zones.findIndex(z => z.zone_id === selectedZone.zone_id);
      setProgramaticallyScrolling(true);
      flatListRef.current.scrollToIndex({index, animated: true, viewPosition: 0.5});
    }
    setPreviousSelectedZone(selectedZone);
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
      {...panResponder.panHandlers}
      {...flatListProps}
      data={zones}
      renderItem={({item: zone}) => <AvalancheForecastZoneCard key={zone.zone_id} zone={zone} date={date} />}
    />
  );
};

const AvalancheForecastZoneCard: React.FunctionComponent<{
  date: Date;
  zone: MapViewZone;
}> = ({date, zone}) => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation<HomeStackNavigationProps>();

  const dangerColor = colorFor(zone.danger_level);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        navigation.navigate('forecast', {
          zoneName: zone.name,
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          dateString: toISOStringUTC(date),
        });
      }}>
      <VStack borderRadius={8} bg="white" width={width * CARD_WIDTH} mx={CARD_MARGIN * width} height={200}>
        <View height={8} width="100%" bg={dangerColor.string()} borderTopLeftRadius={8} borderTopRightRadius={8} pb={0} />
        <VStack px={24} pt={4} pb={12} space={8}>
          <HStack space={8} alignItems="center">
            <AvalancheDangerIcon style={{height: 32}} level={zone.danger_level} />
            <DangerLevelTitle dangerLevel={zone.danger_level} danger={zone.danger} />
          </HStack>
          <Title3Black>{zone.name}</Title3Black>
          <VStack py={8}>
            <Text>
              <Caption1Black>Published: </Caption1Black>
              <Caption1>{utcDateToLocalTimeString(zone.start_date)}</Caption1>
              {'\n'}
              <Caption1Black>Expires: </Caption1Black>
              <Caption1>{utcDateToLocalTimeString(zone.end_date)}</Caption1>
            </Text>
          </VStack>
          <Text>
            <Caption1Black>Travel advice: </Caption1Black>
            <TravelAdvice dangerLevel={zone.danger_level} />
          </Text>
        </VStack>
      </VStack>
    </TouchableOpacity>
  );
};

const DangerLevelTitle: React.FunctionComponent<{
  dangerLevel: DangerLevel;
  danger: string;
}> = ({dangerLevel, danger}) => {
  switch (dangerLevel) {
    case DangerLevel.GeneralInformation:
    case DangerLevel.None:
      return (
        <BodySmSemibold>
          <Text style={{textTransform: 'capitalize'}}>{danger}</Text>
        </BodySmSemibold>
      );
    case DangerLevel.Low:
    case DangerLevel.Moderate:
    case DangerLevel.Considerable:
    case DangerLevel.High:
    case DangerLevel.Extreme:
      return (
        <BodySmSemibold>
          {dangerLevel} - <Text style={{textTransform: 'capitalize'}}>{danger}</Text> Avalanche Danger
        </BodySmSemibold>
      );
  }
  const invalid: never = dangerLevel;
  throw new Error(`Unknown danger level: ${invalid}`);
};
