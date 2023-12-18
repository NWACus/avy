import React, {useCallback, useRef, useState} from 'react';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {View as RNView, StyleSheet, Text, TouchableOpacity, useWindowDimensions} from 'react-native';
import AnimatedMapView, {PoiClickEvent, Region} from 'react-native-maps';

import * as Linking from 'expo-linking';

import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {AvalancheDangerIcon} from 'components/AvalancheDangerIcon';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {CampaignModal} from 'components/content/CampaignModal';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {defaultMapRegionForGeometries, MapViewZone, mapViewZoneFor, ZoneMap} from 'components/content/ZoneMap';
import {Center, HStack, View, VStack} from 'components/core';
import {DangerScale} from 'components/DangerScale';
import {pointInFeature} from 'components/helpers/geographicCoordinates';
import {TravelAdvice} from 'components/helpers/travelAdvice';
import {AnimatedCards, AnimatedDrawerState, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {AvalancheCenterSelectionModal} from 'components/modals/AvalancheCenterSelectionModal';
import {BodySm, BodySmSemibold, Title3Black} from 'components/text';
import {useCampaign} from 'data/campaigns/useCampaign';
import {isAfter} from 'date-fns';
import {toDate} from 'date-fns-tz';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {useMapLayerAvalancheForecasts} from 'hooks/useMapLayerAvalancheForecasts';
import {useMapLayerAvalancheWarnings} from 'hooks/useMapLayerAvalancheWarnings';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {usePreferences} from 'Preferences';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HomeStackNavigationProps, TabNavigationProps} from 'routes';
import {AvalancheCenterID, DangerLevel, ForecastPeriod, MapLayerFeature, ProductType} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime, requestedTimeToUTCDate, utcDateToLocalTimeString} from 'utils/date';

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

  const navigation = useNavigation<HomeStackNavigationProps & TabNavigationProps>();
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
  // On the Android version of the Google Map layer, when a user taps on a map label (a place name, etc),
  // we get a POI click event; we don't get to see the specific point that they tapped on, only the centroid
  // of the POI itself. It doesn't look like we can turn off interactivity with POIs without hiding them entirely,
  // so it seems like the best UX we can provide is to act as if the user tapped in the center of the POI itself
  // and open the forecast zone for that point. When POI labels span multiple zones, that doesn't work perfectly.
  const onPressPOI = useCallback(
    (event: PoiClickEvent) => {
      const matchingZones = mapLayer?.features.filter(feature => pointInFeature(event.nativeEvent.coordinate, feature));
      if (matchingZones && matchingZones.length > 0) {
        onPressPolygon(mapViewZoneFor(center, matchingZones[0]));
      }
    },
    [mapLayer?.features, onPressPolygon, center],
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

  // Begin Q4 2023 campaign code
  const [showCampaign, trackCampaign] = useCampaign(center, 'nwac-campaign-q4-2023', 'map-view');
  const openCampaignLink = useCallback(() => {
    trackCampaign();
    const url = 'https://give.nwac.us/campaign/nwacs-year-end-fundraiser/c536433';
    Linking.openURL(url).catch((error: Error) => logger.error('Error opening URL', {error, url}));
  }, [logger, trackCampaign]);

  const [screenFocused, setScreenFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      // Bake in a delay before showing the campaign modal, so that it doesn't pop up before the map is drawn
      const timeout = setTimeout(() => setScreenFocused(true), 200);
      return () => {
        clearTimeout(timeout);
        setScreenFocused(false);
      };
    }, [setScreenFocused]),
  );
  // End Q4 2023 campaign code

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

  // default to the values in the map layer, but update it with the forecasts and wranings we've fetched
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
            if (forecast.expires_time && isAfter(requestedTimeToUTCDate(requestedTime), toDate(new Date(forecast.expires_time), {timeZone: 'UTC'}))) {
              zonesById[id].danger_level = DangerLevel.GeneralInformation;
            } else if (forecast.product_type === ProductType.Forecast) {
              const currentDanger = forecast.danger.find(d => d.valid_day === ForecastPeriod.Current);
              if (currentDanger) {
                zonesById[id].danger_level = Math.max(currentDanger.lower, currentDanger.middle, currentDanger.upper) as DangerLevel;
              }
            }
            zonesById[id].start_date = forecast.published_time;
            zonesById[id].end_date = forecast.expires_time;
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
  const showAvalancheCenterSelectionModal = !preferences.hasSeenCenterPicker;

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
        onPoiClick={onPressPOI}
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
      <AvalancheCenterSelectionModal visible={screenFocused && showAvalancheCenterSelectionModal} initialSelection={preferences.center} onClose={onSelectCenter} />
      {screenFocused && !showAvalancheCenterSelectionModal && showCampaign && <CampaignModal onAction={openCampaignLink} />}
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
      zoneName: zone.name,
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
          {dangerLevel} - <Text style={{textTransform: 'capitalize'}}>{DangerLevel[dangerLevel]}</Text>
        </BodySmSemibold>
      );
  }
  const invalid: never = dangerLevel;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown danger level: ${invalid}`);
};
