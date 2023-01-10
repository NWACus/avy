import React, {useRef, useState} from 'react';

import {Animated, ActivityIndicator, StyleSheet, Text, useWindowDimensions, PanResponder, TouchableWithoutFeedback} from 'react-native';
import {Alert, Center, HStack, View, VStack} from 'native-base';
import MapView, {Region} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';

import {DangerScale} from 'components/DangerScale';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {AvalancheCenterForecastZonePolygons} from './AvalancheCenterForecastZonePolygons';
import {AvalancheDangerIcon} from './AvalancheDangerIcon';
import {MapViewZone, useMapViewZones} from 'hooks/useMapViewZones';
import {HomeStackNavigationProps} from 'routes';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Body, BodySmSemibold, Caption1, Caption1Black, Title3Black} from 'components/text';
import {colorFor} from './AvalancheDangerPyramid';
import {utcDateToLocalTimeString} from 'utils/date';
import {parseISO} from 'date-fns';

export const defaultRegion: Region = {
  // TODO(skuznets): add a sane default for the US?
  latitude: 47.454188397509135,
  latitudeDelta: 3,
  longitude: -121.769123046875,
  longitudeDelta: 3,
};

export interface MapProps {
  center: AvalancheCenterID;
  date: string;
}

export const AvalancheForecastZoneMap: React.FunctionComponent<MapProps> = ({center, date}: MapProps) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [region, setRegion] = useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0,
    longitudeDelta: 0,
  });

  function setReady() {
    setIsReady(true);
  }

  const largerRegion: Region = {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: 1.05 * region.latitudeDelta,
    longitudeDelta: 1.05 * region.longitudeDelta,
  };
  const {isLoading, isError, data: zones} = useMapViewZones(center, parseISO(date));

  return (
    <>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={defaultRegion}
        region={largerRegion}
        onLayout={setReady}
        zoomEnabled={true}
        scrollEnabled={true}
        provider={'google'}>
        {isReady && <AvalancheCenterForecastZonePolygons key={center} center_id={center} setRegion={setRegion} date={date} />}
      </MapView>
      <SafeAreaView>
        <DangerScale px="4" width="100%" position="absolute" top="12" />
      </SafeAreaView>

      {isLoading && (
        <Center width="100%" height="100%" position="absolute" top="0">
          <ActivityIndicator size={'large'} />
        </Center>
      )}
      {isError && (
        <Center width="100%" position="absolute" bottom="6">
          <Alert status={'warning'} px={6} py={4}>
            <HStack space={2} flexShrink={1}>
              <Alert.Icon mt="1" />
              <Body>Unable to load forecast data</Body>
            </HStack>
          </Alert>
        </Center>
      )}
      {!isLoading && !isError && <AvalancheForecastZoneCards key={center} date={date} zones={zones} />}
    </>
  );
};

export const CARD_WIDTH = 0.9; // proportion of overall width that one card takes up
export const CARD_WHITESPACE = (1 - CARD_WIDTH) / 2; // proportion of overall width that the spacing between cards takes up on the screen
export const CARD_SPACING = CARD_WHITESPACE / 2; // proportion of overall width that the spacing between two cards takes up
export const CARD_MARGIN = CARD_SPACING / 2; // proportion of overall width that each card needs as a margin

enum CardState {
  Hidden = 'Hidden',
  Docked = 'Docked',
  Visible = 'Visible',
}

// These offsets are applied through translateY on the FlatList
const OFFSETS = {
  [CardState.Hidden]: 160,
  [CardState.Docked]: 120,
  [CardState.Visible]: 0,
};

// When a pan gesture goes beyond this distance, we animate to the final state
const SNAP_THRESHOLD = 16;

const AvalancheForecastZoneCards: React.FunctionComponent<{
  date: string;
  zones: MapViewZone[];
}> = ({date, zones}) => {
  const {width} = useWindowDimensions();

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
  const DEFAULT_CARD_STATE = CardState.Docked;
  const yOffset = useRef(new Animated.Value(OFFSETS[DEFAULT_CARD_STATE])).current;
  const responderState = useRef({
    panning: false,
    cardState: DEFAULT_CARD_STATE,
    baseOffset: OFFSETS[DEFAULT_CARD_STATE],
    setState: (state: CardState) => {
      responderState.cardState = state;
      responderState.panning = false;
      responderState.baseOffset = OFFSETS[state];
      yOffset.setOffset(responderState.baseOffset);
      yOffset.setValue(0);
    },
    startPanning: () => {
      responderState.panning = true;
      yOffset.setOffset(responderState.baseOffset);
      yOffset.setValue(0);
    },
    handlePanEvent: (event, gestureState) => {
      const {panning, cardState} = responderState;
      if (!panning) {
        return;
      }

      // Are we moving too far in the X direction? If so, treat as a scroll and stop panning the drawer
      if (Math.abs(gestureState.dx) > SNAP_THRESHOLD) {
        responderState.endPanning();
        return;
      }

      // Detect overscroll in the invalid direction - we allow a little bit of give,
      // but then ignore the events
      if ((cardState === CardState.Docked && gestureState.dy > SNAP_THRESHOLD) || (cardState === CardState.Visible && gestureState.dy < -SNAP_THRESHOLD)) {
        return;
      }

      if (Math.abs(gestureState.dy) > SNAP_THRESHOLD) {
        responderState.panning = false;
        responderState.cardState = responderState.cardState === CardState.Docked ? CardState.Visible : CardState.Docked;
        responderState.baseOffset = OFFSETS[responderState.cardState];
        yOffset.flattenOffset();
        Animated.spring(yOffset, {toValue: responderState.baseOffset, useNativeDriver: true}).start();
      } else {
        Animated.event([null, {dy: yOffset}], {useNativeDriver: false})(event, gestureState);
      }
    },
    endPanning: () => {
      if (responderState.panning) {
        // user panned, but not far enough to change state - we should spring back to our previous position
        responderState.panning = false;
        yOffset.flattenOffset();
        Animated.spring(yOffset, {toValue: responderState.baseOffset, useNativeDriver: true}).start();
      }
      responderState.panning = false;
    },
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: responderState.startPanning,
      onPanResponderMove: responderState.handlePanEvent,
      onPanResponderRelease: responderState.endPanning,
    }),
  ).current;

  return (
    <Animated.FlatList
      horizontal
      style={[
        {
          position: 'absolute',
          width: '100%',
          bottom: 6,
          transform: [
            {
              translateY: yOffset.interpolate({
                inputRange: [OFFSETS[CardState.Visible] - SNAP_THRESHOLD, OFFSETS[CardState.Hidden] + SNAP_THRESHOLD],
                outputRange: [OFFSETS[CardState.Visible] - SNAP_THRESHOLD, OFFSETS[CardState.Hidden] + SNAP_THRESHOLD],
                extrapolate: 'clamp',
              }),
            },
          ],
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
  date: string;
  zone: MapViewZone;
}> = ({date, zone}) => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation<HomeStackNavigationProps>();

  const dangerColor = colorFor(zone.danger_level);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        navigation.navigate('forecast', {
          zoneName: zone.name,
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          date: date,
        });
      }}>
      <VStack borderRadius={8} bg="white" width={width * CARD_WIDTH} marginX={CARD_MARGIN * width}>
        <View height="8px" width="100%" bg={dangerColor.string()} borderTopRadius={8} pb={0} />
        <VStack px={6} pt={1} pb={3} space={2}>
          <HStack space={2} alignItems="center">
            <AvalancheDangerIcon style={{height: 32}} level={zone.danger_level} />
            <BodySmSemibold>
              {zone.danger_level} - <Text style={{textTransform: 'capitalize'}}>{zone.danger}</Text> Avalanche Danger
            </BodySmSemibold>
          </HStack>
          <Title3Black>{zone.name}</Title3Black>
          <VStack py={2}>
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
            <Caption1>{zone.travel_advice}</Caption1>
          </Text>
        </VStack>
      </VStack>
    </TouchableWithoutFeedback>
  );
};
