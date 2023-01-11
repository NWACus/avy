import React, {useState} from 'react';

import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, useWindowDimensions} from 'react-native';
import {Alert, Center, FlatList, HStack, View, VStack} from 'native-base';
import MapView, {Region} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';

import {DangerScale} from 'components/DangerScale';
import {AvalancheCenterID, DangerLevel} from 'types/nationalAvalancheCenter';
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

const AvalancheForecastZoneCards: React.FunctionComponent<{
  date: string;
  zones: MapViewZone[];
}> = ({date, zones}) => {
  const {width} = useWindowDimensions();

  const props = {
    snapToAlignment: 'start',
    decelerationRate: 'fast',
    snapToOffsets: zones?.map((_itemData, index) => index * CARD_WIDTH * width + (index - 1) * CARD_SPACING * width),
    contentInset: {
      left: CARD_MARGIN * width,
      right: CARD_MARGIN * width,
    },
    contentContainerStyle: {paddingHorizontal: CARD_MARGIN * width},
  } as const;

  return (
    <FlatList
      horizontal
      width="100%"
      position="absolute"
      bottom="4"
      {...props}
      data={zones}
      renderItem={({item: zone}) => <AvalancheForecastZoneCard key={zone.zone_id} zone={zone} date={date} />}></FlatList>
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
    <TouchableOpacity
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
            <DangerLevelTitle dangerLevel={zone.danger_level} danger={zone.danger} />
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
