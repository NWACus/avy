import {useNavigation} from '@react-navigation/native';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {HStack, View, VStack} from 'components/core';
import {TravelAdvice} from 'components/helpers/travelAdvice';
import {AnimatedCards, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {MapViewZone} from 'components/map/ZoneMap';
import {BodySm, BodySmSemibold, Title3Black} from 'components/text';
import React, {RefObject, useCallback} from 'react';
import {Text, TouchableOpacity, useWindowDimensions} from 'react-native';
import {MainStackNavigationProps} from 'routes';
import {AvalancheCenterID, DangerLevel} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime, utcDateToLocalTimeString} from 'utils/date';

export const AvalancheForecastZoneCards: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  zones: MapViewZone[];
  selectedZoneId: number | null;
  setSelectedZoneId: React.Dispatch<React.SetStateAction<number | null>>;
  controllerRef: RefObject<AnimatedMapWithDrawerController>;
  bottomOffset?: number;
}> = ({center_id, date, zones, selectedZoneId, setSelectedZoneId, controllerRef, bottomOffset}) => {
  return AnimatedCards<MapViewZone, number>({
    center_id: center_id,
    date: date,
    items: zones,
    getItemId: zone => zone.zone_id,
    selectedItemId: selectedZoneId,
    setSelectedItemId: setSelectedZoneId,
    controllerRef: controllerRef,
    renderItem: ({date, item}) => <AvalancheForecastZoneCard date={date} zone={item} />,
    bottomOffset: bottomOffset,
  });
};

const AvalancheForecastZoneCard: React.FunctionComponent<{
  date: RequestedTime;
  zone: MapViewZone;
}> = React.memo(({date, zone}: {date: RequestedTime; zone: MapViewZone}) => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation<MainStackNavigationProps>();

  const dangerLevel = zone.danger_level ?? DangerLevel.None;
  const dangerColor = colorFor(dangerLevel);
  const onPress = useCallback(() => {
    navigation.navigate('forecast', {
      center_id: zone.center_id,
      forecast_zone_id: zone.zone_id,
      requestedTime: formatRequestedTime(date),
    });
  }, [navigation, zone, date]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <VStack borderRadius={8} bg="white" width={width * CARD_WIDTH} mx={CARD_MARGIN * width} height={'100%'}>
        <View height={8} width="100%" bg={dangerColor.string()} borderTopLeftRadius={8} borderTopRightRadius={8} pb={0} />
        <VStack px={24} pt={4} pb={12} space={8}>
          <HStack space={8} alignItems="center">
            <AvalancheDangerIcon style={{height: 32}} level={dangerLevel} />
            <DangerLevelTitle dangerLevel={dangerLevel} />
          </HStack>
          <Title3Black>{zone.name}</Title3Black>
          {(zone.start_date || zone.end_date) && (
            <VStack py={8}>
              <Text>
                {zone.start_date && (
                  <>
                    <BodySm>Published: </BodySm>
                    <BodySm>{utcDateToLocalTimeString(zone.start_date)}</BodySm>
                    {'\n'}
                  </>
                )}
                {zone.end_date && (
                  <>
                    <BodySm>Expires: </BodySm>
                    <BodySm>{utcDateToLocalTimeString(zone.end_date)}</BodySm>
                  </>
                )}
              </Text>
            </VStack>
          )}
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
    case DangerLevel.None:
      return (
        <BodySmSemibold>
          <Text style={{textTransform: 'capitalize'}}>No Rating</Text>
        </BodySmSemibold>
      );
    case DangerLevel.Low:
    case DangerLevel.Moderate:
    case DangerLevel.Considerable:
    case DangerLevel.High:
    case DangerLevel.Extreme:
      return (
        <BodySmSemibold>
          {dangerLevel} - <Text style={{textTransform: 'capitalize'}}>{DangerLevel[dangerLevel]}</Text>
        </BodySmSemibold>
      );
  }
  const invalid: never = dangerLevel;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown danger level: ${invalid}`);
};
