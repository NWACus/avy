import {useNavigation} from '@react-navigation/native';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {MapViewZone, defaultMapRegionForGeometries} from 'components/content/ZoneMap';
import {HStack, VStack, View} from 'components/core';
import {AnimatedCards, AnimatedDrawerState, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {AvalancheForecastZonePolygon} from 'components/map/AvalancheForecastZonePolygon';
import {BodyBlack, BodySm, Title3Black} from 'components/text';
import {geoDistance} from 'd3-geo';
import {useMapLayer} from 'hooks/useMapLayer';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React, {useRef, useState} from 'react';
import {View as RNView, StyleSheet, Text, TouchableOpacity, useWindowDimensions} from 'react-native';
import {default as AnimatedMapView, MAP_TYPES, MapCircle, MapPressEvent, default as MapView, Region} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WeatherStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, MapLayerFeature, WeatherStation, WeatherStationCollection, WeatherStationSource} from 'types/nationalAvalancheCenter';
import {RequestedTime, RequestedTimeString, formatRequestedTime, parseRequestedTimeString} from 'utils/date';

export const WeatherStationMap: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  token: string;
  requestedTime: RequestedTimeString;
}> = ({center_id, token, requestedTime}) => {
  const [ready, setReady] = useState<boolean>(false);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const mapLayerResult = useMapLayer(center_id);
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata(center_id, token);
  const weatherStations = weatherStationsResult.data;
  const avalancheCenterMapRegion: Region = defaultMapRegionForGeometries(mapLayer?.features.map(feature => feature.geometry));
  const [circleRadius, setCircleRadius] = useState<number>(radiusForExtent(avalancheCenterMapRegion.latitudeDelta));

  const topElements = React.useRef<RNView>(null);

  const navigation = useNavigation<WeatherStackNavigationProps>();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const onPressMapView = React.useCallback(
    (event: MapPressEvent) => {
      // react-native-maps does not give us an onPress for our circles, so we need to determine
      // whether the user tapped 'on' a circle by looking at their tap point and figuring out if
      // it's 'close enough' given the size of the circle we're drawing. First, let's find the
      // distance to all stations and record the closest distance we encountered
      const coordinate = event.nativeEvent.coordinate;
      if (!coordinate) {
        return;
      }

      let closestDistance: number = Number.MAX_SAFE_INTEGER;
      let closestStation: WeatherStation | undefined = undefined;
      for (const station of weatherStations?.features || []) {
        if (station.geometry.type !== 'Point') {
          continue;
        }
        const distance = EARTH_RADIUS_KM * geoDistance([coordinate.longitude, coordinate.latitude], [station.geometry.coordinates[0], station.geometry.coordinates[1]]);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestStation = station;
        }
      }

      // now, determine if that closest distance is within the size of the circles we'd be drawing
      // at this map zoom level - double the allowable radius to give a bigger touch target
      if (closestDistance <= circleRadius * 2 && closestStation) {
        if (selectedStationId === closestStation.properties.stid) {
          const identifier: Record<string, WeatherStationSource> = {};
          identifier[closestStation.properties.stid] = closestStation.properties.source;
          navigation.navigate('stationDetail', {
            center_id: center_id,
            stations: identifier,
            name: closestStation.properties.name,
            requestedTime: requestedTime,
            zoneName: 'Weather Data',
          });
        } else {
          setSelectedStationId(closestStation.properties.stid);
        }
      }
    },
    [navigation, selectedStationId, requestedTime, weatherStations, circleRadius, center_id],
  );

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapView = useRef<AnimatedMapView>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapView, logger)).current;
  React.useEffect(() => {
    controller.animateUsingUpdatedAvalancheCenterMapRegion(avalancheCenterMapRegion);
  }, [avalancheCenterMapRegion, controller]);

  if (incompleteQueryState(mapLayerResult, weatherStationsResult) || !mapLayer || !weatherStations) {
    return <QueryState results={[mapLayerResult, weatherStationsResult]} />;
  }

  // we want light grey zones in the background here
  const zones: MapViewZone[] = mapLayer.features.map((feature: MapLayerFeature) => ({
    zone_id: feature.id,
    geometry: feature.geometry,
    hasWarning: false,
    center_id: center_id,
    name: feature.properties.name,
    danger_level: DangerLevel.None,
    start_date: feature.properties.start_date,
    end_date: feature.properties.end_date,
    fillOpacity: 0.1,
  }));

  return (
    <>
      <MapView.Animated
        ref={mapView}
        style={StyleSheet.absoluteFillObject}
        onLayout={() => {
          setReady(true);
        }}
        provider={'google'}
        mapType={MAP_TYPES.TERRAIN}
        zoomEnabled={true}
        scrollEnabled={true}
        initialRegion={avalancheCenterMapRegion}
        onRegionChange={region => {
          setCircleRadius(radiusForExtent(region.latitudeDelta));
        }}
        onPress={onPressMapView}>
        {ready && zones?.map(zone => <AvalancheForecastZonePolygon key={zone.zone_id} zone={zone} selected={false} renderFillColor={true} />)}
        {ready &&
          weatherStations?.features
            ?.filter(station => station.geometry.type === 'Point')
            .map(station => (
              <WeatherStationPoint key={station.properties.stid} station={station} selected={station.properties.stid === selectedStationId} radiusKm={circleRadius} />
            ))}
      </MapView.Animated>
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
            onLayout={() => {
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
            }}></VStack>
        </View>
      </SafeAreaView>

      <WeatherStationCards
        key={center_id}
        center_id={center_id}
        date={parseRequestedTimeString(requestedTime)}
        stations={weatherStations}
        selectedStationId={selectedStationId}
        setSelectedStationId={setSelectedStationId}
        controller={controller}
      />
    </>
  );
};

export const EARTH_RADIUS_KM = 6378.1;
export const radiusForExtent = (latitudeDelta: number): number => {
  const latitudeDeltaRadians = (latitudeDelta * Math.PI) / 180;
  const latitudeDeltaKilometers = latitudeDeltaRadians * EARTH_RADIUS_KM;
  return latitudeDeltaKilometers / 100;
};
export const WeatherStationPoint: React.FunctionComponent<{
  station: WeatherStation;
  selected: boolean;
  radiusKm: number;
}> = ({station, selected, radiusKm}) => {
  if (station.geometry.type !== 'Point') {
    return <></>;
  }

  const highlight = colorLookup('blue.100');
  const colors = colorsForSource(station.properties.source);
  const coordinate = {latitude: station.geometry.coordinates[1], longitude: station.geometry.coordinates[0]};

  return (
    <MapCircle
      key={station.properties.stid}
      center={coordinate}
      radius={radiusKm * 1000} // in meters
      strokeWidth={selected ? 8 : 4}
      strokeColor={selected ? highlight.toString() : colors.primary}
      fillColor={colors.secondary}
    />
  );
};
export const WeatherStationCards: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  stations: WeatherStationCollection;
  selectedStationId: string | null;
  setSelectedStationId: React.Dispatch<React.SetStateAction<string | null>>;
  controller: AnimatedMapWithDrawerController;
}> = ({center_id, date, stations, selectedStationId, setSelectedStationId, controller}) => {
  return AnimatedCards<WeatherStation, string>({
    center_id: center_id,
    date: date,
    items: stations.features,
    getItemId: station => station.properties.stid,
    selectedItemId: selectedStationId,
    setSelectedItemId: setSelectedStationId,
    controller: controller,
    renderItem: ({date, center_id, item}) => <WeatherStationCard center_id={center_id} date={date} station={item} />,
  });
};
export const WeatherStationCard: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  station: WeatherStation;
}> = React.memo(({center_id, date, station}: {center_id: AvalancheCenterID; date: RequestedTime; station: WeatherStation}) => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation<WeatherStackNavigationProps>();

  const colors = colorsForSource(station.properties.source);
  const identifier: Record<string, WeatherStationSource> = {};
  identifier[station.properties.stid] = station.properties.source;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        navigation.navigate('stationDetail', {
          center_id: center_id,
          stations: identifier,
          name: station.properties.name,
          requestedTime: formatRequestedTime(date),
          zoneName: 'Weather Data',
        });
      }}>
      <VStack borderRadius={8} bg="white" width={width * CARD_WIDTH} mx={CARD_MARGIN * width} height={'100%'}>
        <View height={8} width="100%" bg={colors.primary} borderTopLeftRadius={8} borderTopRightRadius={8} pb={0} />
        <VStack px={24} pt={12} pb={12} space={8}>
          <HStack flex={1} space={8} alignItems="center" justifyContent="space-between">
            <HStack flex={1}>
              <Title3Black style={{textTransform: 'capitalize'}}>{station.properties.name.toLowerCase()}</Title3Black>
            </HStack>
          </HStack>
          <VStack py={8}>
            <Text>
              <BodySm>Operator: </BodySm>
              <BodyBlack color={colors.primary}>{station.properties.source.toUpperCase()}</BodyBlack>
            </Text>
            <Text>
              <BodySm>Elevation: </BodySm>
              <BodySm>{station.properties.elevation} ft</BodySm>
            </Text>
          </VStack>
        </VStack>
      </VStack>
    </TouchableOpacity>
  );
});
WeatherStationCard.displayName = 'WeatherStationCard';
const colorsForSource = (source: WeatherStationSource) => {
  switch (source) {
    case WeatherStationSource.NWAC:
      return {primary: '#0059C8', secondary: '#98CBFF'};
    case WeatherStationSource.SNOTEL:
      return {primary: '#006D23', secondary: '#9ED696'};
    case WeatherStationSource.MESOWEST:
      return {primary: '#EA983F', secondary: 'rgba(234, 152, 63, 0.2)'};
  }
  const invalid: never = source;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown weather station source: ${invalid}`);
};
