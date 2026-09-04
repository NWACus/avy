import {useNavigation} from '@react-navigation/native';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {HStack, View, VStack} from 'components/core';
import {DangerLevelTitle} from 'components/helpers/DangerLevelTitle';
import {TravelAdvice} from 'components/helpers/travelAdvice';
import {AnimatedCards, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {MapViewZone} from 'components/map/ZoneMap';
import {BodySm, Title3Black} from 'components/text';
import React, {RefObject, useCallback} from 'react';
import {Text, TouchableOpacity, useWindowDimensions} from 'react-native';
import {MainStackNavigationProps} from 'routes';
import {AvalancheCenterID, DangerLevel} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime, utcDateToLocalTimeString} from 'utils/date';

const getZoneId = (zone: MapViewZone): number => zone.zone_id;

export const AvalancheForecastZoneCards: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  zones: MapViewZone[];
  selectedZoneId: number | null;
  setSelectedZoneId: React.Dispatch<React.SetStateAction<number | null>>;
  controllerRef: RefObject<AnimatedMapWithDrawerController>;
  bottomOffset?: number;
  renderHeaderAccessory?: (zone: MapViewZone) => React.ReactNode;
  renderFooter?: (zone: MapViewZone) => React.ReactNode;
}> = ({center_id, date, zones, selectedZoneId, setSelectedZoneId, controllerRef, bottomOffset, renderHeaderAccessory, renderFooter}) => {
  const renderItem = useCallback(
    ({date, item}: {date: RequestedTime; item: MapViewZone}) => (
      <AvalancheForecastZoneCard date={date} zone={item} headerAccessory={renderHeaderAccessory?.(item)} footer={renderFooter?.(item)} />
    ),
    [renderHeaderAccessory, renderFooter],
  );

  return AnimatedCards<MapViewZone, number>({
    center_id: center_id,
    date: date,
    items: zones,
    getItemId: getZoneId,
    selectedItemId: selectedZoneId,
    setSelectedItemId: setSelectedZoneId,
    controllerRef: controllerRef,
    renderItem: renderItem,
    bottomOffset: bottomOffset,
  });
};

interface AvalancheForecastZoneCardProps {
  date: RequestedTime;
  zone: MapViewZone;
  headerAccessory?: React.ReactNode;
  footer?: React.ReactNode;
}

const AvalancheForecastZoneCard: React.FunctionComponent<AvalancheForecastZoneCardProps> = React.memo(({date, zone, headerAccessory, footer}: AvalancheForecastZoneCardProps) => {
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
          <HStack space={8} alignItems="center" justifyContent="space-between">
            <HStack space={8} alignItems="center" flexShrink={1}>
              <AvalancheDangerIcon style={{height: 32}} level={dangerLevel} />
              <DangerLevelTitle dangerLevel={dangerLevel} />
            </HStack>
            {headerAccessory}
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
          {footer}
        </VStack>
      </VStack>
    </TouchableOpacity>
  );
});
AvalancheForecastZoneCard.displayName = 'AvalancheForecastZoneCard';
