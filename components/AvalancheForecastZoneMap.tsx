import React, {useCallback, useRef, useState} from 'react';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {View as RNView, StyleSheet, Text, TouchableOpacity, useWindowDimensions} from 'react-native';

import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {MapViewZone, mapViewZoneFor, ZoneMap} from 'components/content/ZoneMap';
import {Center, HStack, View, VStack} from 'components/core';
import {FocusAwareStatusBar} from 'components/core/FocusAwareStatusBar';
import {DangerScale} from 'components/DangerScale';
import {TravelAdvice} from 'components/helpers/travelAdvice';
import {AnimatedCards, AnimatedDrawerState, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {AvalancheCenterSelectionModal} from 'components/modals/AvalancheCenterSelectionModal';
import {BodySm, BodySmSemibold, Title3Black} from 'components/text';
import {isAfter} from 'date-fns';
import {toDate} from 'date-fns-tz';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {useMapLayerAvalancheForecasts} from 'hooks/useMapLayerAvalancheForecasts';
import {useMapLayerAvalancheWarnings} from 'hooks/useMapLayerAvalancheWarnings';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {usePostHog} from 'posthog-react-native';
import {usePreferences} from 'Preferences';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HomeStackNavigationProps, TabNavigationProps} from 'routes';
import {AvalancheCenterID, DangerLevel, ForecastPeriod, MapLayerFeature, ProductType} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime, requestedTimeToUTCDate, utcDateToLocalTimeString} from 'utils/date';

import {Camera} from '@rnmapbox/maps';
import {defaultMapRegionForGeometries} from 'components/helpers/geographicCoordinates';

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

  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center) {
      postHog.screen('avalancheForecastMap', {
        center: center,
      });
    }
  }, [postHog, center]);
  useFocusEffect(recordAnalytics);

  const navigation = useNavigation<HomeStackNavigationProps & TabNavigationProps>();
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  const onMapPress = useCallback(
    (_: GeoJSON.Feature) => {
      // Since the polygons are layered on the map, this is only called when the map is tapped outside of a polygon
      setSelectedZoneId(null);
    },
    [setSelectedZoneId],
  );

  const onPolygonPress = useCallback(
    (zone: MapViewZone) => {
      if (selectedZoneId === zone.zone_id) {
        navigation.navigate('forecast', {
          center_id: zone.center_id,
          forecast_zone_id: zone.zone_id,
          requestedTime: formatRequestedTime(requestedTime),
        });
      } else {
        setSelectedZoneId(zone.zone_id);
      }
    },
    [navigation, selectedZoneId, requestedTime, setSelectedZoneId],
  );

  const avalancheCenterMapRegion = defaultMapRegionForGeometries(mapLayer?.features.map(feature => feature.geometry));

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapCameraRef = useRef<Camera>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(
    new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapCameraRef, logger),
  ).current;
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

  const {preferences, setPreferences} = usePreferences();

  const onLayout = useCallback(() => {
    // onLayout returns position relative to parent - we need position relative to screen
    topElements.current?.measureInWindow((x, y, width, height) => {
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
  }, [controller]);

  const onSelectCenter = useCallback(
    (center: AvalancheCenterID) => {
      setPreferences({center: center, hasSeenCenterPicker: true});
      // We need to clear navigation state to force all screens from the
      // previous avalanche center selection to unmount
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    },
    [setPreferences, navigation],
  );

  if (incompleteQueryState(mapLayerResult, metadataResult, ...forecastResults, ...warningResults) || !mapLayer || !metadata) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']}>
        <Center width="100%" height="100%">
          <QueryState
            results={[mapLayerResult, metadataResult, ...forecastResults, ...warningResults]}
            terminal
            customMessage={{
              notFound: () => ({
                headline: 'Missing forecast',
                body: 'There may not be a forecast available for today.',
              }),
            }}
          />
        </Center>
      </SafeAreaView>
    );
  }

  // default to the values in the map layer, but update it with the forecasts and warnings we've fetched
  const zonesById: Record<string, MapViewZone> = mapLayer.features.reduce((accum: Record<string, MapViewZone>, feature: MapLayerFeature) => {
    accum[feature.id] = mapViewZoneFor(center, feature);
    return accum;
  }, {});
  forecastResults
    .map(result => result.data) // get data from the results
    .filter(data => data) // only operate on results that have succeeded
    .forEach(forecast => {
      forecast &&
        forecast.forecast_zone?.forEach(({id}) => {
          if (zonesById[id]) {
            // If the zone is marked as off-season in the map layer, we want the danger level to be None so that the color is grey
            // regarless of what the forecast says
            if (zonesById[id].feature.properties.off_season) {
              zonesById[id].danger_level = DangerLevel.None;
            } else {
              // the map layer will expose old forecasts with their danger level as appropriate, but the map expects to show a card
              // that doesn't divulge the old forecast's rating, travel advice or publication/expiry times, so we clear things out
              if (
                !zonesById[id].end_date ||
                (zonesById[id].end_date &&
                  isAfter(requestedTimeToUTCDate(requestedTime), toDate(new Date(zonesById[id].end_date || '2000-01-01'), {timeZone: 'UTC'}))) /* requesting after expiry */
              ) {
                zonesById[id].danger_level = DangerLevel.GeneralInformation;
                zonesById[id].end_date = null;
                zonesById[id].start_date = null;
              }
              // product-specific queries can give us results that are expired or older than the map layer, in which case we don't
              // want to use them
              if (
                (forecast.product_type === ProductType.Forecast || forecast.product_type === ProductType.Summary) &&
                forecast.expires_time &&
                (isAfter(toDate(new Date(forecast.expires_time), {timeZone: 'UTC'}), requestedTimeToUTCDate(requestedTime)) /* product is not expired */ ||
                  (zonesById[id].end_date &&
                    isAfter(
                      toDate(new Date(forecast.expires_time), {timeZone: 'UTC'}),
                      toDate(new Date(zonesById[id].end_date || '2000-01-01'), {timeZone: 'UTC'}),
                    ))) /* product newer than map layer */
              ) {
                if (forecast.product_type === ProductType.Forecast) {
                  const currentDanger = forecast.danger.find(d => d.valid_day === ForecastPeriod.Current);
                  if (currentDanger) {
                    const maxCurrentDanger = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper) as DangerLevel;
                    // If we're in season, use the forecast's danger level only if it's not None
                    if (maxCurrentDanger !== DangerLevel.None) {
                      zonesById[id].danger_level = maxCurrentDanger;
                    }
                  }
                }

                // Regardless if the product type is a summary or forecast, we want to use the forecast API timestamp as it has timezone information
                zonesById[id].start_date = forecast.published_time;
                zonesById[id].end_date = forecast.expires_time;
              }
            }
          }
        });
    });
  warningResults
    .map(result => result.data) // get data from the results
    .forEach(warning => {
      if (!warning) {
        return;
      }
      // the warnings endpoint can return warnings, watches and special bulletins; we only want to make the map flash
      // when there's an active warning for the zone
      if (
        'product_type' in warning.data &&
        warning.data.product_type === ProductType.Warning &&
        'expires_time' in warning.data &&
        isAfter(toDate(new Date(warning.data.expires_time), {timeZone: 'UTC'}), requestedTimeToUTCDate(requestedTime))
      ) {
        const mapViewZoneData = zonesById[warning.zone_id];
        if (mapViewZoneData) {
          mapViewZoneData.hasWarning = true;
        }
      }
    });
  const zones = Object.keys(zonesById).map(k => zonesById[k]);
  const showAvalancheCenterSelectionModal = !preferences.hasSeenCenterPicker;

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" translucent backgroundColor={'rgba(0, 0, 0, 0.35)'} />
      <ZoneMap
        ref={mapCameraRef}
        style={StyleSheet.absoluteFillObject}
        initialCameraBounds={avalancheCenterMapRegion.cameraBounds}
        zones={zones}
        selectedZoneId={selectedZoneId}
        onPolygonPress={onPolygonPress}
        onMapPress={onMapPress}
      />
      <SafeAreaView>
        <View>
          <VStack ref={topElements} width="100%" position="absolute" top={0} left={0} right={0} mt={8} px={4} flex={1} onLayout={onLayout}>
            <DangerScale width="100%" />
          </VStack>
        </View>
      </SafeAreaView>

      <AvalancheForecastZoneCards
        key={center}
        center_id={center}
        date={requestedTime}
        zones={zones}
        selectedZoneId={selectedZoneId}
        setSelectedZoneId={setSelectedZoneId}
        controller={controller}
      />
      <AvalancheCenterSelectionModal visible={showAvalancheCenterSelectionModal} initialSelection={preferences.center} onClose={onSelectCenter} />
    </>
  );
};

const AvalancheForecastZoneCards: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  zones: MapViewZone[];
  selectedZoneId: number | null;
  setSelectedZoneId: React.Dispatch<React.SetStateAction<number | null>>;
  controller: AnimatedMapWithDrawerController;
}> = ({center_id, date, zones, selectedZoneId, setSelectedZoneId, controller}) => {
  return AnimatedCards<MapViewZone, number>({
    center_id: center_id,
    date: date,
    items: zones,
    getItemId: zone => zone.zone_id,
    selectedItemId: selectedZoneId,
    setSelectedItemId: setSelectedZoneId,
    controller: controller,
    renderItem: ({date, item}) => <AvalancheForecastZoneCard date={date} zone={item} />,
  });
};

const AvalancheForecastZoneCard: React.FunctionComponent<{
  date: RequestedTime;
  zone: MapViewZone;
}> = React.memo(({date, zone}: {date: RequestedTime; zone: MapViewZone}) => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation<HomeStackNavigationProps>();

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
          {(zone.start_date || zone.start_date) && (
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
