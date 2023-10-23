import {useNavigation} from '@react-navigation/native';
import {MapViewZone, defaultMapRegionForGeometries} from 'components/content/ZoneMap';
import {HStack, VStack, View} from 'components/core';
import {AnimatedCards, AnimatedDrawerState, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {AvalancheForecastZonePolygon} from 'components/map/AvalancheForecastZonePolygon';
import {BodySm, BodySmSemibold, Title3Black} from 'components/text';
import {formatData, formatUnits, orderStationVariables} from 'components/weather_data/WeatherStationDetail';
import {geoDistance} from 'd3-geo';
import {format, isAfter, parseISO} from 'date-fns';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React, {useRef, useState} from 'react';
import {View as RNView, StyleSheet, TouchableOpacity, useWindowDimensions} from 'react-native';
import {default as AnimatedMapView, MAP_TYPES, MapCircle, MapPressEvent, default as MapView, Region} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WeatherStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {
  AvalancheCenterID,
  DangerLevel,
  MapLayer,
  MapLayerFeature,
  Variable,
  WeatherStation,
  WeatherStationCollection,
  WeatherStationSource,
  WeatherStationTimeseries,
  WeatherStationTimeseriesEntry,
} from 'types/nationalAvalancheCenter';
import {RequestedTime, RequestedTimeString, formatRequestedTime, parseRequestedTimeString} from 'utils/date';

export const WeatherStationMap: React.FunctionComponent<{
  mapLayer: MapLayer;
  weatherStations: WeatherStationCollection;
  timeseries: WeatherStationTimeseries;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  toggleList: () => void;
}> = ({mapLayer, weatherStations, timeseries, center_id, requestedTime, toggleList}) => {
  const [ready, setReady] = useState<boolean>(false);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
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
          navigation.navigate('stationDetail', {
            center_id: center_id,
            stationId: closestStation.properties.stid,
            source: closestStation.properties.source,
            requestedTime: requestedTime,
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

  const points = React.useMemo(
    () =>
      weatherStations?.features
        ?.filter(station => station.geometry.type === 'Point')
        .map(station => <WeatherStationPoint key={station.properties.stid} station={station} selected={station.properties.stid === selectedStationId} radiusKm={circleRadius} />),
    [weatherStations, selectedStationId, circleRadius],
  );

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
        {ready && points}
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
        timeseries={timeseries}
        selectedStationId={selectedStationId}
        setSelectedStationId={setSelectedStationId}
        controller={controller}
        buttonOnPress={() => {
          toggleList();
        }}
      />
    </>
  );
};

export const EARTH_RADIUS_KM = 6378.1;
export const radiusForExtent = (latitudeDelta: number): number => {
  const latitudeDeltaRadians = (latitudeDelta * Math.PI) / 180;
  const latitudeDeltaKilometers = latitudeDeltaRadians * EARTH_RADIUS_KM;
  return latitudeDeltaKilometers / 75;
};
export const WeatherStationPoint: React.FunctionComponent<{
  station: WeatherStation;
  selected: boolean;
  radiusKm: number;
}> = React.memo(({station, selected, radiusKm}: {station: WeatherStation; selected: boolean; radiusKm: number}) => {
  if (station.geometry.type !== 'Point') {
    return <></>;
  }

  const highlight = colorLookup('blue.100');
  const lowlight = colorLookup('gray.900');
  const colors = colorsForSource(station.properties.source);
  const coordinate = {latitude: station.geometry.coordinates[1], longitude: station.geometry.coordinates[0]};

  return (
    <MapCircle
      key={station.properties.stid}
      center={coordinate}
      radius={radiusKm * 1000} // in meters
      strokeWidth={selected ? 2 : 1}
      strokeColor={selected ? highlight.toString() : lowlight.toString()}
      fillColor={colors.primary}
    />
  );
});
WeatherStationPoint.displayName = 'WeatherStationPoint';

export const WeatherStationCards: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  stations: WeatherStationCollection;
  timeseries: WeatherStationTimeseries;
  selectedStationId: string | null;
  setSelectedStationId: React.Dispatch<React.SetStateAction<string | null>>;
  controller: AnimatedMapWithDrawerController;
  buttonOnPress: () => void;
}> = ({center_id, date, stations, timeseries, selectedStationId, setSelectedStationId, controller, buttonOnPress}) => {
  return AnimatedCards<WeatherStation, string>({
    center_id: center_id,
    date: date,
    items: stations.features,
    getItemId: station => station.properties.stid,
    selectedItemId: selectedStationId,
    setSelectedItemId: setSelectedStationId,
    controller: controller,
    renderItem: ({date, center_id, item}) => (
      <WeatherStationCard
        mode={'map'}
        center_id={center_id}
        date={date}
        station={item}
        timeseries={timeseries.STATION.find(t => t.stid === item.properties.stid)}
        units={timeseries.UNITS}
        variables={timeseries.VARIABLES}
      />
    ),
    buttonOnPress: buttonOnPress,
  });
};

interface rowData {
  variable: Variable;
  data: number | string | null;
}

const weatherStationCardDateString = (date: Date): string => {
  return format(date, `MMM d h:mm a`);
};

export const WeatherStationCard: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  station: WeatherStation;
  timeseries?: WeatherStationTimeseriesEntry;
  units: Record<string, string>;
  variables: Variable[];
  mode: 'map' | 'list';
}> = React.memo(
  ({
    center_id,
    date,
    station,
    timeseries,
    units,
    variables,
    mode,
  }: {
    center_id: AvalancheCenterID;
    date: RequestedTime;
    station: WeatherStation;
    timeseries?: WeatherStationTimeseriesEntry;
    units: Record<string, string>;
    variables: Variable[];
    mode: 'map' | 'list';
  }) => {
    const {width} = useWindowDimensions();
    const navigation = useNavigation<WeatherStackNavigationProps>();

    let latestObservationDate: Date | undefined;
    let latestObservation: Record<string, string | number | null> | undefined;
    if (timeseries) {
      for (const observation of timeseries.observations) {
        if ('date_time' in observation) {
          const observationTime = parseISO(String(observation['date_time']));
          if (latestObservationDate === undefined || isAfter(observationTime, latestObservationDate)) {
            latestObservationDate = observationTime;
            latestObservation = observation;
          }
        }
      }
    }

    const orderedVariables = timeseries && orderStationVariables(variables, timeseries.timezone);
    const rows: rowData[] | undefined = orderedVariables?.map(v => {
      let data = null;
      if (timeseries && latestObservation && v.variable in latestObservation) {
        data = latestObservation[v.variable];
      }
      return {
        variable: v,
        data: data,
      };
    });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          navigation.navigate('stationDetail', {
            center_id: center_id,
            stationId: station.properties.stid,
            source: station.properties.source,
            requestedTime: formatRequestedTime(date),
          });
        }}>
        <VStack
          borderRadius={8}
          bg="white"
          {...(mode === 'map'
            ? {
                width: width * CARD_WIDTH,
                mx: CARD_MARGIN * width,
                height: '100%',
              }
            : {
                mx: 8,
                my: 8,
              })}>
          <View height={8} width="100%" bg={colorLookup('border.base')} borderTopLeftRadius={8} borderTopRightRadius={8} pb={0} />
          <VStack px={24} pt={12} space={8}>
            <HStack flex={1} space={8} alignItems="center" justifyContent="space-between">
              <HStack flex={1}>
                <Title3Black style={{textTransform: 'capitalize'}}>{station.properties.name.toLowerCase()}</Title3Black>
              </HStack>
            </HStack>
            <HStack space={2}>
              <BodySmSemibold>
                {station.properties.source.toUpperCase()} | {station.properties.elevation} ft
                {latestObservationDate && ' | '}
                {latestObservationDate && weatherStationCardDateString(latestObservationDate)}
              </BodySmSemibold>
            </HStack>
            {rows && (
              // should this be a ListView? maybe yes
              <VStack>
                {rows
                  .filter(({variable, data}) => variable.variable !== 'date_time' && !!data)
                  .map(({variable, data}, index) => (
                    <HStack
                      key={variable.variable}
                      justifyContent={'space-between'}
                      alignContent="center"
                      height={24}
                      bg={index % 2 ? 'white' : colorLookup('background.base')}
                      px={8}>
                      <BodySm>{variable.long_name}</BodySm>
                      <HStack space={2}>
                        <BodySm>{formatData(variable, [data])[0]}</BodySm>
                        <BodySm>{formatUnits(variable, units)}</BodySm>
                      </HStack>
                    </HStack>
                  ))}
              </VStack>
            )}
          </VStack>
        </VStack>
      </TouchableOpacity>
    );
  },
);
WeatherStationCard.displayName = 'WeatherStationCard';

const colorsForSource = (source: WeatherStationSource) => {
  switch (source) {
    case WeatherStationSource.NWAC:
      return {primary: colorLookup('weather.nwac.primary').toString(), secondary: colorLookup('weather.nwac.secondary').toString()};
    case WeatherStationSource.SNOTEL:
      return {primary: colorLookup('weather.snotel.primary').toString(), secondary: colorLookup('weather.snotel.secondary').toString()};
    case WeatherStationSource.MESOWEST:
      return {primary: colorLookup('weather.mesowest.primary').toString(), secondary: colorLookup('weather.mesowest.secondary').toString()};
  }
  const invalid: never = source;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown weather station source: ${invalid}`);
};
