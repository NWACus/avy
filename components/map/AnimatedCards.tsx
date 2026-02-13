import {AntDesign} from '@expo/vector-icons';
import {Camera, CameraBounds} from '@rnmapbox/maps';
import {Logger} from 'browser-bunyan';
import {HStack, View} from 'components/core';
import {AvalancheCenterRegion} from 'components/helpers/geographicCoordinates';
import {add, isAfter} from 'date-fns';
import _, {isEqual} from 'lodash';
import {LoggerContext, LoggerProps} from 'loggerContext';
import md5 from 'md5';
import React, {RefObject, useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  PanResponderGestureState,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {RequestedTime, toISOStringUTC} from 'utils/date';

export const CARD_WIDTH = 0.9; // proportion of overall width that one card takes up
export const CARD_WHITESPACE = (1 - CARD_WIDTH) / 2; // proportion of overall width that the spacing between cards takes up on the screen
export const CARD_SPACING = CARD_WHITESPACE / 2; // proportion of overall width that the spacing between two cards takes up
export const CARD_MARGIN = CARD_SPACING / 2; // proportion of overall width that each card needs as a margin
export enum AnimatedDrawerState {
  Hidden = 'Hidden',
  Docked = 'Docked',
  Visible = 'Visible',
}

export class AnimatedMapWithDrawerController {
  // These offsets are applied through translateY on the FlatList drawer
  static readonly OFFSETS = {
    [AnimatedDrawerState.Hidden]: 280,
    [AnimatedDrawerState.Docked]: 155,
    [AnimatedDrawerState.Visible]: 0,
  };

  // When a pan gesture goes beyond this distance, we animate the drawer to the final state
  static readonly SNAP_THRESHOLD = 16;

  static readonly BUTTON_PADDING = 8;
  static readonly BUTTON_HEIGHT = 8;

  logger: Logger;

  // The following members manage the state of the drawer at the bottom of the map
  state: AnimatedDrawerState;
  baseOffset: number;
  panning: boolean;
  yOffset: Animated.Value;

  // The following members manage the optional button above the cards
  buttonYOffset: Animated.Value;

  // The following members determine the map's region
  baseAvalancheCenterMapRegion: AvalancheCenterRegion;
  windowWidth = 0;
  windowHeight = 0;
  topElementsOffset = 0;
  topElementsHeight = 0;
  cardDrawerMaximumHeight = 0;
  tabBarHeight = 0;
  mapCameraRef: RefObject<Camera | null>;
  // We store the last time we logged a region calculation so as to continue logging but not spam
  lastLogged: Record<string, string>; // mapping hash of parameters to the time we last logged it

  constructor(state = AnimatedDrawerState.Docked, region: AvalancheCenterRegion, mapCameraRef: RefObject<Camera | null>, logger: Logger) {
    this.logger = logger;
    this.state = state;
    this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[state];
    this.panning = false;
    this.yOffset = new Animated.Value(this.baseOffset);
    this.buttonYOffset = new Animated.Value(this.baseOffset);
    this.baseAvalancheCenterMapRegion = region;
    this.mapCameraRef = mapCameraRef;
    this.lastLogged = {};
  }

  setState(state: AnimatedDrawerState, shouldAnimateRegion: boolean = true) {
    this.state = state;
    this.panning = false;
    this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[state];

    this.yOffset.flattenOffset();
    this.buttonYOffset.flattenOffset();
    if (shouldAnimateRegion) {
      this.animateMapRegion();
    }

    Animated.parallel([
      Animated.spring(this.yOffset, {toValue: this.baseOffset, useNativeDriver: true}),
      Animated.spring(this.buttonYOffset, {toValue: this.buttonOffset(), useNativeDriver: true}),
    ]).start();
  }

  onPanResponderGrant() {
    this.panning = true;
    this.yOffset.setOffset(this.baseOffset);
    this.yOffset.setValue(0);
    this.buttonYOffset.setOffset(this.baseOffset);
    this.buttonYOffset.setValue(0);
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
      this.buttonYOffset.flattenOffset();
      this.animateMapRegion();
      Animated.parallel([
        Animated.spring(this.yOffset, {toValue: this.baseOffset, useNativeDriver: true}),
        Animated.spring(this.buttonYOffset, {toValue: this.buttonOffset(), useNativeDriver: true}),
      ]).start();
    } else {
      Animated.event([null, {dy: this.yOffset}], {useNativeDriver: false})(event, gestureState);
    }
  }

  onPanResponderRelease() {
    if (this.panning) {
      // user panned, but not far enough to change state - we should spring back to our previous position
      this.panning = false;
      this.yOffset.flattenOffset();
      this.buttonYOffset.flattenOffset();
      Animated.parallel([
        Animated.spring(this.yOffset, {toValue: this.baseOffset, useNativeDriver: true}),
        Animated.spring(this.buttonYOffset, {toValue: this.buttonOffset(), useNativeDriver: true}),
      ]).start();
    }
    this.panning = false;
  }

  buttonOffset(): number {
    if (this.baseOffset === AnimatedMapWithDrawerController.OFFSETS[AnimatedDrawerState.Hidden]) {
      return AnimatedMapWithDrawerController.BUTTON_HEIGHT - AnimatedMapWithDrawerController.BUTTON_PADDING;
    }
    return this.baseOffset - this.cardDrawerMaximumHeight - AnimatedMapWithDrawerController.BUTTON_HEIGHT - AnimatedMapWithDrawerController.BUTTON_PADDING;
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
    if (this.cardDrawerMaximumHeight !== height) {
      this.cardDrawerMaximumHeight = height;
      this.animateMapRegion();
    }
  }

  animateUsingUpdatedTopElementsHeight(offset: number, height: number) {
    if (this.topElementsOffset !== offset || this.topElementsHeight !== height) {
      this.topElementsOffset = offset;
      this.topElementsHeight = height;
      this.animateMapRegion();
    }
  }

  animateUsingUpdatedTabBarHeight(height: number) {
    if (this.tabBarHeight !== height) {
      this.tabBarHeight = height;
      this.animateMapRegion();
    }
  }

  animateUsingUpdatedWindowDimensions(width: number, height: number) {
    if (this.windowHeight !== height || this.windowWidth !== width) {
      this.windowHeight = height;
      this.windowWidth = width;
      this.animateMapRegion();
    }
  }

  animateUsingUpdatedAvalancheCenterMapRegion(avalancheCenterMapRegion: AvalancheCenterRegion) {
    if (!isEqual(this.baseAvalancheCenterMapRegion, avalancheCenterMapRegion)) {
      this.baseAvalancheCenterMapRegion = avalancheCenterMapRegion;
      this.animateMapRegion();
    }
  }

  // This function gets called many times in short succession when the layout changes. We debounce it so that
  // we only try to animate after layout changes are complete.
  ANIMATION_DEBOUNCE_MS = 250;

  private animateMapRegion = _.debounce(() => {
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
      this.baseAvalancheCenterMapRegion.longitudeDelta /
      (projectionConversionFactor(this.baseAvalancheCenterMapRegion.centerCoordinate.latitude) * this.baseAvalancheCenterMapRegion.latitudeDelta);
    const viewAspectRatio = unobstructedWidth / unobstructedHeight;

    // next, we determine the conversion factor between pixels and geographic coordinate degrees
    let degreesPerPixelHorizontally = 0;
    let degreesPerPixelVertically = 0;
    if (regionAspectRatio > viewAspectRatio) {
      // our region is wider than our view, so width is our limiting factor
      degreesPerPixelHorizontally = this.baseAvalancheCenterMapRegion.longitudeDelta / unobstructedWidth;
      degreesPerPixelVertically = degreesPerPixelHorizontally / projectionConversionFactor(this.baseAvalancheCenterMapRegion.centerCoordinate.latitude);
    } else {
      // our region is taller than our view, so height is our limiting factor
      degreesPerPixelVertically = this.baseAvalancheCenterMapRegion.latitudeDelta / unobstructedHeight;
      degreesPerPixelHorizontally = degreesPerPixelVertically * projectionConversionFactor(this.baseAvalancheCenterMapRegion.centerCoordinate.latitude);
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

    const displayedRegionLat = this.baseAvalancheCenterMapRegion.centerCoordinate.latitude + regionCenterYOffsetPixels * degreesPerPixelVertically;
    const displayedRegionLatDelta = this.windowHeight * degreesPerPixelVertically;

    const displayedRegionLong = this.baseAvalancheCenterMapRegion.centerCoordinate.longitude + regionCenterXOffsetPixels * degreesPerPixelHorizontally;
    const displayedRegionLongDelta = this.windowWidth * degreesPerPixelHorizontally;

    const displayedRegionCameraBounds: CameraBounds = {
      ne: [displayedRegionLong + displayedRegionLongDelta / 2, displayedRegionLat + displayedRegionLatDelta / 2],
      sw: [displayedRegionLong - displayedRegionLongDelta / 2, displayedRegionLat - displayedRegionLatDelta / 2],
    };

    const displayedRegion: AvalancheCenterRegion = {
      centerCoordinate: {latitude: displayedRegionLat, longitude: displayedRegionLong},
      latitudeDelta: displayedRegionLatDelta,
      longitudeDelta: displayedRegionLongDelta,
      cameraBounds: displayedRegionCameraBounds,
    };

    // we will get asked to animate a couple of times before the layout settles, at which point we don't have all
    // the parameters we need to calculate the real region to animate to; for those passes through this function
    // we can't animate to this computed displayed region as we'll have NaNs inside, etc
    let targetRegion: AvalancheCenterRegion;
    if (degreesPerPixelVertically > 0 && degreesPerPixelHorizontally > 0) {
      targetRegion = displayedRegion;
    } else {
      targetRegion = this.baseAvalancheCenterMapRegion;
    }
    if (
      isNaN(targetRegion.centerCoordinate.latitude) ||
      isNaN(targetRegion.centerCoordinate.longitude) ||
      isNaN(targetRegion.latitudeDelta) ||
      isNaN(targetRegion.longitudeDelta)
    ) {
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

    this.mapCameraRef?.current?.setCamera({bounds: targetRegion.cameraBounds, heading: 0});
  }, this.ANIMATION_DEBOUNCE_MS);
}

interface ItemRenderData<T, U> {
  key: U;
  item: T;
  date: RequestedTime;
  center_id: AvalancheCenterID;
}

export interface AnimatedCardsProps<T, U> {
  center_id: AvalancheCenterID;
  date: RequestedTime;
  items: T[];
  getItemId: (item: T) => U;
  selectedItemId: U | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<U | null>>;
  controllerRef: RefObject<AnimatedMapWithDrawerController>;
  renderItem: (item: ItemRenderData<T, U>) => React.ReactElement;
  buttonOnPress?: () => void;
}

export const AnimatedCards = <T, U>(props: AnimatedCardsProps<T, U>) => {
  const {center_id, date, items, getItemId, selectedItemId, setSelectedItemId, controllerRef, renderItem, buttonOnPress} = props;
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const {width} = useWindowDimensions();

  const [previouslySelectedItemId, setPreviouslySelectedItemId] = useState<U | null>(null);
  const [programmaticallyScrolling, setProgrammaticallyScrolling] = useState<boolean>(false);

  const offsets = items?.map((_itemData, index) => index * CARD_WIDTH * width + (index - 1) * CARD_SPACING * width);
  const flatListProps = {
    snapToAlignment: 'center',
    decelerationRate: 'fast',
    snapToOffsets: offsets,
    contentInset: {
      left: CARD_MARGIN * width,
      right: CARD_MARGIN * width,
    },
    contentContainerStyle: {paddingHorizontal: CARD_MARGIN * width},
  } as const;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, {dx, dy}) => dx > 0 || dy > 0,
      onPanResponderGrant: () => controllerRef.current.onPanResponderGrant(),
      onPanResponderMove: (e, gestureState) => controllerRef.current.onPanResponderMove(e, gestureState),
      onPanResponderRelease: () => controllerRef.current.onPanResponderRelease(),
    }),
  ).current;

  const flatListRef = useRef<FlatList>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => controllerRef.current.animateUsingUpdatedCardDrawerMaximumHeight(event.nativeEvent.layout.height), [controllerRef]);

  const renderItemAdapter = useCallback(({item}: {item: ItemRenderData<T, U>}) => renderItem(item), [renderItem]);

  // handleScroll updates the highlighted zone on the map when a user scrolls. Called about once per
  // frame by the onScroll event of the FlatList component while scrolling.
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      logger.debug('handleScroll started');
      if (!offsets || offsets.length === 0) {
        return;
      }

      // When programmatically scrolling the map has already been updated so there is no need to do
      // anything.
      if (programmaticallyScrolling) {
        logger.debug('handleScroll exiting because programmaticallyScrolling');
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

      // Set the selected item to that which the user scrolls to so that the highlighted zone on the
      // map correctly updates.
      const itemId = getItemId(items[index]);
      if (itemId !== selectedItemId) {
        logger.debug('handleScroll setting selected item ID');
        setSelectedItemId(itemId);
        // Set the previously selected item ID as well to avoid a programmatic scroll
        setPreviouslySelectedItemId(itemId);
      }
    },
    [logger, getItemId, items, offsets, programmaticallyScrolling, selectedItemId, setSelectedItemId, setPreviouslySelectedItemId, width],
  );

  // onMomentumScrollEnd is called at the very end of a scroll for both user scrolls and
  // programmatic scrolls. Its primary function is to turn off the programmaticallyScrolling flag,
  // in the case of a user scroll it also makes one final call to handleScroll to ensure the map
  // highlighting is up to date.
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (programmaticallyScrolling) {
        logger.debug('onMomentumScrollEnd turning off programmatic scroll');
        setProgrammaticallyScrolling(false);
        return;
      }
      handleScroll(event);
    },
    [programmaticallyScrolling, logger, handleScroll],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: width * CARD_WIDTH,
      offset: offsets[index],
      index,
    }),
    [offsets, width],
  );

  // The list view has drawer-like behavior - it can be swiped into view, or swiped away.
  // These values control the state that's driven through gestures & animation.
  useEffect(() => {
    if (selectedItemId && controllerRef.current.state !== AnimatedDrawerState.Visible) {
      controllerRef.current.setState(AnimatedDrawerState.Visible);
    } else if (!selectedItemId && controllerRef.current.state === AnimatedDrawerState.Visible) {
      controllerRef.current.setState(AnimatedDrawerState.Docked);
    }
  }, [selectedItemId, controllerRef]);

  // The selected item changes when a user selects a zone on the map, programmatically scroll to the
  // appropriate card.
  useEffect(() => {
    if (selectedItemId !== previouslySelectedItemId) {
      if (selectedItemId) {
        const index = items.findIndex(i => getItemId(i) === selectedItemId);
        setProgrammaticallyScrolling(true);
        flatListRef.current?.scrollToIndex({index, animated: true});
      }
      setPreviouslySelectedItemId(selectedItemId);
    }
  }, [selectedItemId, previouslySelectedItemId, flatListRef, items, setProgrammaticallyScrolling, setPreviouslySelectedItemId, getItemId]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: '100%',
          bottom: 6,
          transform: [controllerRef.current.getTransform()],
        },
      ]}>
      {buttonOnPress && (
        <View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: -48,
            },
          ]}>
          <TouchableOpacity onPress={buttonOnPress}>
            <HStack px={8}>
              <View flex={1} />
              <View px={8} py={4} bg={'primary'} borderRadius={30}>
                <AntDesign name={'bars'} size={24} color={colorLookup('primary.background').toString()} />
              </View>
            </HStack>
          </TouchableOpacity>
        </View>
      )}
      <Animated.FlatList
        initialNumToRender={items.length}
        ref={flatListRef}
        initialScrollIndex={items.findIndex(item => getItemId(item) === selectedItemId) === -1 ? 0 : items.findIndex(item => getItemId(item) === selectedItemId)}
        horizontal
        style={{width: '100%'}}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onLayout={onLayout}
        getItemLayout={getItemLayout}
        {...panResponder.panHandlers}
        {...flatListProps}
        data={
          items.map(
            (i: T): ItemRenderData<T, U> => ({
              key: getItemId(i),
              item: i,
              date: date,
              center_id: center_id,
            }),
          ) as unknown as Animated.WithAnimatedObject<ArrayLike<ItemRenderData<T, U>>>
        }
        renderItem={renderItemAdapter}
      />
    </Animated.View>
  );
};
