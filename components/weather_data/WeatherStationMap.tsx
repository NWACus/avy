import {useNavigation} from '@react-navigation/native';
import {MapViewZone, defaultMapRegionForGeometries} from 'components/content/ZoneMap';
import {HStack, VStack, View} from 'components/core';
import {AnimatedCards, AnimatedDrawerState, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {AvalancheForecastZonePolygon} from 'components/map/AvalancheForecastZonePolygon';
import {BodySm, BodySmSemibold, Title3Black} from 'components/text';
import {formatData, formatUnits, orderStationVariables} from 'components/weather_data/WeatherStationDetail';
import {format} from 'date-fns';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React, {useRef, useState} from 'react';
import {View as RNView, StyleSheet, TouchableOpacity, useWindowDimensions} from 'react-native';
import {default as AnimatedMapView, LatLng, MAP_TYPES, MapMarker, default as MapView, Region} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle} from 'react-native-svg';
import {WeatherStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, MapLayer, MapLayerFeature, Variable, WeatherStation, WeatherStationCollection, WeatherStationSource} from 'types/nationalAvalancheCenter';
import {RequestedTime, RequestedTimeString, formatRequestedTime, parseRequestedTimeString} from 'utils/date';

export const WeatherStationMap: React.FunctionComponent<{
  mapLayer: MapLayer;
  weatherStations: WeatherStationCollection;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  toggleList: () => void;
}> = ({mapLayer, weatherStations, center_id, requestedTime, toggleList}) => {
  const [ready, setReady] = useState<boolean>(false);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const avalancheCenterMapRegion: Region = defaultMapRegionForGeometries(mapLayer?.features.map(feature => feature.geometry));

  const topElements = React.useRef<RNView>(null);

  const navigation = useNavigation<WeatherStackNavigationProps>();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const onPressMarker = React.useCallback(
    (station: WeatherStation) => {
      if (selectedStationId === station.properties.stid) {
        navigation.navigate('stationDetail', {
          center_id: center_id,
          stationId: station.properties.stid,
          source: station.properties.source,
          requestedTime: requestedTime,
        });
      } else {
        setSelectedStationId(station.properties.stid);
      }
    },
    [navigation, selectedStationId, requestedTime, center_id],
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
        ?.map(station => ({
          station,
          // Use 1000 as a sentinel value for invalid coordinates
          latitude: station.geometry.type === 'Point' ? station.geometry.coordinates[1] : 1000,
          longitude: station.geometry.type === 'Point' ? station.geometry.coordinates[0] : 1000,
        }))
        .filter(({latitude, longitude}) => latitude !== 1000 && longitude !== 1000)
        .map(({station, latitude, longitude}) => (
          <WeatherStationMarker
            key={station.properties.stid}
            selected={station.properties.stid === selectedStationId}
            coordinate={{latitude, longitude}}
            onPressMarker={onPressMarker}
            station={station}
          />
        )),
    [weatherStations, selectedStationId, onPressMarker],
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
        initialRegion={avalancheCenterMapRegion}>
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

const WeatherStationMarker: React.FC<{station: WeatherStation; selected: boolean; coordinate: LatLng; onPressMarker: (station: WeatherStation) => void}> = ({
  station,
  selected,
  coordinate,
  onPressMarker,
}) => {
  // We set tracksViewChanges={false} for maximum performance, but that means that we need to manually
  // trigger redraws of a marker when the selected state changes.
  const markerRef = useRef<MapMarker>(null);
  const forceMarkerRedraw = () => {
    markerRef.current?.redraw();
  };
  const [currentlySelected, setCurrentlySelected] = useState(false);
  if (currentlySelected !== selected) {
    setCurrentlySelected(selected);
    forceMarkerRedraw();
  }

  return (
    <MapMarker
      ref={markerRef}
      key={station.properties.stid}
      coordinate={coordinate}
      onPress={() => {
        onPressMarker(station);
      }}
      stopPropagation={true}
      tappable={true}
      draggable={false}
      tracksViewChanges={false}
      tracksInfoWindowChanges={false}
      anchor={{x: 0.5, y: 0.5}}>
      {iconForSource(station.properties.source, selected)}
    </MapMarker>
  );
};

export const WeatherStationCards: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  stations: WeatherStationCollection;
  selectedStationId: string | null;
  setSelectedStationId: React.Dispatch<React.SetStateAction<string | null>>;
  controller: AnimatedMapWithDrawerController;
  buttonOnPress: () => void;
}> = ({center_id, date, stations, selectedStationId, setSelectedStationId, controller, buttonOnPress}) => {
  return AnimatedCards<WeatherStation, string>({
    center_id: center_id,
    date: date,
    items: stations.features,
    getItemId: station => station.properties.stid,
    selectedItemId: selectedStationId,
    setSelectedItemId: setSelectedStationId,
    controller: controller,
    renderItem: ({date, center_id, item}) => (
      <WeatherStationCard mode={'map'} center_id={center_id} date={date} station={item} units={stations.properties.units} variables={stations.properties.variables} />
    ),
    buttonOnPress: buttonOnPress,
  });
};

interface rowData {
  variable: Variable;
  data: number | string | null;
}

const weatherStationCardDateString = (dateString: string | number | null | undefined): string | null => {
  return typeof dateString === 'string' ? format(new Date(dateString), `MMM d h:mm a`) : null;
};

export const WeatherStationCard: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  station: WeatherStation;
  units: Record<string, string>;
  variables: Variable[];
  mode: 'map' | 'list';
}> = React.memo(
  ({
    center_id,
    date,
    station,
    units,
    variables,
    mode,
  }: {
    center_id: AvalancheCenterID;
    date: RequestedTime;
    station: WeatherStation;
    units: Record<string, string>;
    variables: Variable[];
    mode: 'map' | 'list';
  }) => {
    const {width} = useWindowDimensions();
    const navigation = useNavigation<WeatherStackNavigationProps>();

    const latestObservationDateString = weatherStationCardDateString(station.properties.data['date_time']);
    const latestObservation: Record<string, string | number | null> | undefined = station.properties.data;

    const orderedVariables = latestObservation && orderStationVariables(variables, station.properties.timezone);
    const rows: rowData[] | undefined = orderedVariables?.map(v => {
      let data = null;
      if (latestObservation && v.variable in latestObservation) {
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
                {latestObservationDateString && ' | '}
                {latestObservationDateString}
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

const iconSize = 24;
const strokeWidth = 5;
const radius = 50 - 2 * strokeWidth;
const circleIcons = {
  [WeatherStationSource.NWAC]: {
    selected: (
      <Svg height={iconSize} width={iconSize} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} stroke="white" strokeWidth={strokeWidth} fill={colorLookup('weather.nwac.primary')} />
      </Svg>
    ),
    unselected: (
      <Svg height={iconSize} width={iconSize} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} stroke={colorLookup('text')} strokeWidth={strokeWidth} fill={colorLookup('weather.nwac.primary')} />
      </Svg>
    ),
  },
  [WeatherStationSource.SNOTEL]: {
    selected: (
      <Svg height={iconSize} width={iconSize} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} stroke="white" strokeWidth={strokeWidth} fill={colorLookup('weather.snotel.primary')} />
      </Svg>
    ),
    unselected: (
      <Svg height={iconSize} width={iconSize} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} stroke={colorLookup('text')} strokeWidth={strokeWidth} fill={colorLookup('weather.snotel.primary')} />
      </Svg>
    ),
  },
  [WeatherStationSource.MESOWEST]: {
    selected: (
      <Svg height={iconSize} width={iconSize} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} stroke="white" strokeWidth={strokeWidth} fill={colorLookup('weather.mesowest.primary')} />
      </Svg>
    ),
    unselected: (
      <Svg height={iconSize} width={iconSize} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r={radius} stroke={colorLookup('text')} strokeWidth={strokeWidth} fill={colorLookup('weather.mesowest.primary')} />
      </Svg>
    ),
  },
} as const;

const iconForSource = (source: WeatherStationSource, selected: boolean) => {
  switch (source) {
    case WeatherStationSource.NWAC:
    case WeatherStationSource.SNOTEL:
    case WeatherStationSource.MESOWEST:
      return selected ? circleIcons[source].selected : circleIcons[source].unselected;
  }
  const invalid: never = source;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown weather station source: ${invalid}`);
};
