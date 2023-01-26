import React, {useCallback, useRef, useState} from 'react';

import {Animated, ActivityIndicator, StyleSheet, Text, useWindowDimensions, PanResponder, PanResponderGestureState, GestureResponderEvent, TouchableOpacity} from 'react-native';
import MapView, {Region} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';

import {Center, HStack, View, VStack} from 'components/core';
import {DangerScale} from 'components/DangerScale';
import {AvalancheCenterID, DangerLevel} from 'types/nationalAvalancheCenter';
import {AvalancheDangerIcon} from './AvalancheDangerIcon';
import {MapViewZone, useMapViewZones} from 'hooks/useMapViewZones';
import {HomeStackNavigationProps} from 'routes';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Body, BodySmSemibold, Caption1, Caption1Black, Title3Black} from 'components/text';
import {colorFor} from './AvalancheDangerPyramid';
import {apiDateString, utcDateToLocalTimeString} from 'utils/date';
import {TravelAdvice} from './helpers/travelAdvice';
import {COLORS} from 'theme/colors';
import {FontAwesome5} from '@expo/vector-icons';
import {AvalancheForecastZonePolygon} from 'components/AvalancheForecastZonePolygon';
import {RegionBounds, regionFromBounds} from 'components/helpers/geographicCoordinates';

export const defaultRegion: Region = {
  // TODO(skuznets): add a sane default for the US?
  latitude: 47.454188397509135,
  latitudeDelta: 3,
  longitude: -121.769123046875,
  longitudeDelta: 3,
};

export interface MapProps {
  center: AvalancheCenterID;
  date: Date;
}

export const AvalancheForecastZoneMap: React.FunctionComponent<MapProps> = ({center, date}: MapProps) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [region, setRegionBounds] = useState<RegionBounds>({
    topLeft: {latitude: 0, longitude: 0},
    bottomRight: {latitude: 0, longitude: 0},
  });

  function setReady() {
    setIsReady(true);
  }

  const largerRegion: Region = regionFromBounds(region);
  largerRegion.latitudeDelta *= 1.05;
  largerRegion.longitudeDelta *= 1.05;
  const {isLoading, isError, data: zones} = useMapViewZones(center, date);

  const [selectedZone, setSelectedZone] = useState<MapViewZone | null>(null);
  const onPress = useCallback(() => {
    setSelectedZone(null);
  }, []);

  return (
    <>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={defaultRegion}
        region={largerRegion}
        onLayout={setReady}
        zoomEnabled={true}
        scrollEnabled={true}
        provider={'google'}
        onPress={onPress}>
        {isReady && zones?.map(zone => <AvalancheForecastZonePolygon key={zone.zone_id} zone={zone} setRegionBounds={setRegionBounds} setSelectedZone={setSelectedZone} />)}
      </MapView>
      <SafeAreaView>
        <View flex={1}>
          <DangerScale px={4} width="100%" position="absolute" top={12} />
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
      {!isLoading && !isError && <AvalancheForecastZoneCards key={center} date={date} zones={zones} selectedZone={selectedZone} />}
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
  // These offsets are applied through translateY on the FlatList
  static readonly OFFSETS = {
    [AnimatedDrawerState.Hidden]: 220,
    [AnimatedDrawerState.Docked]: 120,
    [AnimatedDrawerState.Visible]: 0,
  };

  // When a pan gesture goes beyond this distance, we animate to the final state
  static readonly SNAP_THRESHOLD = 16;

  state: AnimatedDrawerState;
  baseOffset: number;
  panning: boolean;
  yOffset: Animated.Value;

  constructor(state = AnimatedDrawerState.Docked) {
    this.state = state;
    this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[state];
    this.panning = false;
    this.yOffset = new Animated.Value(this.baseOffset);
  }

  setState(state: AnimatedDrawerState) {
    this.state = state;
    this.panning = false;
    this.baseOffset = AnimatedMapWithDrawerController.OFFSETS[state];
    this.yOffset.flattenOffset();
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
}

const AvalancheForecastZoneCards: React.FunctionComponent<{
  date: Date;
  zones: MapViewZone[];
  selectedZone: MapViewZone | null;
}> = ({date, zones, selectedZone}) => {
  const {width} = useWindowDimensions();

  const [previousSelectedZone, setPreviousSelectedZone] = useState<MapViewZone | null>(null);

  const flatListProps = {
    snapToAlignment: 'start',
    decelerationRate: 'fast',
    snapToOffsets: zones?.map((_itemData, index) => index * CARD_WIDTH * width + (index - 1) * CARD_SPACING * width),
    contentInset: {
      left: CARD_MARGIN * width,
      right: CARD_MARGIN * width,
    },
    contentContainerStyle: {paddingHorizontal: CARD_MARGIN * width},
  } as const;

  // The list view has drawer-like behavior - it can be swiped into view, or swiped away.
  // These values control the state that's driven through gestures & animation.
  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const panResponderController = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden)).current;
  if (selectedZone && panResponderController.state !== AnimatedDrawerState.Visible) {
    panResponderController.setState(AnimatedDrawerState.Visible);
  } else if (!selectedZone && panResponderController.state === AnimatedDrawerState.Visible) {
    panResponderController.setState(AnimatedDrawerState.Docked);
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, {dx, dy}) => dx > 0 || dy > 0,
      onPanResponderGrant: () => panResponderController.onPanResponderGrant(),
      onPanResponderMove: (e, gestureState) => panResponderController.onPanResponderMove(e, gestureState),
      onPanResponderRelease: () => panResponderController.onPanResponderRelease(),
    }),
  ).current;

  const flatListRef = useRef(null);

  if (selectedZone !== previousSelectedZone) {
    if (selectedZone) {
      const index = zones.findIndex(z => z.zone_id === selectedZone.zone_id);
      flatListRef.current.scrollToIndex({index, animated: true, viewPosition: 0.5});
    }
    setPreviousSelectedZone(selectedZone);
  }

  return (
    <Animated.FlatList
      ref={flatListRef}
      horizontal
      style={[
        {
          position: 'absolute',
          width: '100%',
          bottom: 6,
          transform: [panResponderController.getTransform()],
        },
      ]}
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
          dateString: apiDateString(date),
        });
      }}>
      <VStack borderRadius={8} bg="white" width={width * CARD_WIDTH} mx={CARD_MARGIN * width}>
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
