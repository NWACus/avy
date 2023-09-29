import React, {useCallback, useRef, useState} from 'react';
import {View as RNView, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {Logger} from 'browser-bunyan';
import {AnimatedCards, AnimatedDrawerState, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/AvalancheForecastZoneMap';
import {AvalancheForecastZonePolygon} from 'components/AvalancheForecastZonePolygon';
import {ActionList} from 'components/content/ActionList';
import {Card} from 'components/content/Card';
import {NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {MapViewZone, defaultMapRegionForGeometries} from 'components/content/ZoneMap';
import {HStack, VStack, View} from 'components/core';
import {RegionBounds, featureBounds, pointInFeature} from 'components/helpers/geographicCoordinates';
import {BodyBlack, BodySm, Title3Black} from 'components/text';
import {geoDistance} from 'd3-geo';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {default as AnimatedMapView, MAP_TYPES, MapCircle, MapPressEvent, default as MapView, Region} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WeatherStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {
  AvalancheCenterID,
  DangerLevel,
  MapLayer,
  MapLayerFeature,
  WeatherStation,
  WeatherStationCollection,
  WeatherStationProperties,
  WeatherStationSource,
} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTime, RequestedTimeString, formatRequestedTime, parseRequestedTimeString} from 'utils/date';

interface Props {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
}

export const WeatherStationList: React.FC<Props> = ({center_id, requestedTime}) => {
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  if (incompleteQueryState(avalancheCenterMetadataResult) || !metadata) {
    return <QueryState results={[avalancheCenterMetadataResult]} />;
  }

  if (!metadata.widget_config.stations?.token) {
    return <NotFound terminal what={[new NotFoundError('no token for stations', 'weather stations')]} />;
  }

  return <StationList center_id={center_id} token={metadata.widget_config.stations?.token} requestedTime={requestedTime} />;
};

const EARTH_RADIUS = 6378.1; // in kilometers

const radiusForExtent = (latitudeDelta: number): number => {
  const latitudeDeltaRadians = (latitudeDelta * Math.PI) / 180;
  const latitudeDeltaKilometers = latitudeDeltaRadians * EARTH_RADIUS;
  return latitudeDeltaKilometers / 100;
};

const StationList: React.FunctionComponent<{
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
  const onPressMapView = useCallback(
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
        const distance = EARTH_RADIUS * geoDistance([coordinate.longitude, coordinate.latitude], [station.geometry.coordinates[0], station.geometry.coordinates[1]]);
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

  if (center_id === 'NWAC') {
    return <NWACStationList center={center_id} mapLayer={mapLayer} stations={weatherStations} requestedTime={requestedTime} />;
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
            .map(station => <WeatherStationPoint key={station.properties.stid} station={station} selected={station.properties.stid === selectedStationId} radius={circleRadius} />)}
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

const WeatherStationPoint: React.FunctionComponent<{
  station: WeatherStation;
  selected: boolean;
  radius: number;
}> = ({station, selected, radius}) => {
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
      radius={radius * 1000} // in meters
      strokeWidth={selected ? 8 : 4}
      strokeColor={selected ? highlight.toString() : colors.primary}
      fillColor={colors.secondary}
    />
  );
};

const WeatherStationCards: React.FunctionComponent<{
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

const WeatherStationCard: React.FunctionComponent<{
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

const stationGroupMapping = {
  // Snoqualmie Pass
  'Alpental Ski Area': ['1', '2', '3'],
  'Snoqualmie Pass': ['21', '22', '23'],

  // Stevens Pass
  'Stevens Pass Ski Area - Tye Mill Chair, Skyline Chair': ['17', '18'],
  'Stevens Pass - WSDOT Schmidt Haus': ['13'],
  'Grace Lakes & Old Faithful': ['14', '51'],
  'Stevens Pass Ski Area - Brooks Chair': ['50'],

  // West South
  'Crystal Mt Ski Area': ['28', '29'],
  'Crystal Mt. - Green Valley & Campbell Basin': ['27', '54'],
  'Mt Baker Ski Area': ['5', '6'],
  'Mount Rainier - Sunrise': ['30', '31'],
  'Mount Rainier - Paradise': ['35', '36'],
  'Mount Rainier - Camp Muir': ['34'],
  'Chinook Pass': ['32', '33'],
  'White Pass': ['37', '39', '49'],
  'Mt St Helens': ['40'],

  // West Central
  'White Chuck': ['57'],

  // East Central
  'Mission Ridge Ski Area': ['24', '25', '26'],
  'Tumwater Mt. & Leavenworth': ['19', '53'],
  'Dirtyface Mt': ['10'],

  // East North
  'Washington Pass': ['8', '9'],

  // Mt Hood
  'Skibowl Ski Area - Government Camp': ['46', '47'],
  'Timberline Lodge': ['44', '56'],
  'Timberline Ski Area - Magic Mile Chair': ['45'],
  'Mt Hood Meadows Ski Area': ['42', '43'],
  'Mt. Hood Meadows Cascade Express': ['41'],
};

const decommissionedStations = [
  '15', // Stevens Pass - Brooks Wind (Retired 2019)
];

export interface ZoneWithWeatherStations {
  feature: MapLayerFeature;
  bounds: RegionBounds;
  stationGroups: Record<string, WeatherStationProperties[]>;
}

export const NWACStationsByZone = (mapLayer: MapLayer, stations: WeatherStationCollection, logger: Logger): ZoneWithWeatherStations[] => {
  const zones: ZoneWithWeatherStations[] = mapLayer.features.map(f => ({feature: f, bounds: featureBounds(f), stationGroups: {}}));
  stations.features
    .map(feature => feature.properties)
    .filter(s => s.source === 'nwac')
    .filter(s => !decommissionedStations.includes(s.stid))
    .forEach(s => {
      if (!s.latitude || !s.longitude) {
        return;
      }
      const matchingZones = zones.filter(zoneData => pointInFeature({latitude: s.latitude, longitude: s.longitude}, zoneData.feature));
      const stationLogger = logger.child({station: {id: s.id, name: s.name, coordinates: {lat: s.latitude, lng: s.longitude}}});
      if (matchingZones.length === 0) {
        stationLogger.warn(`unable to find matching zone for weather station`);
      } else if (matchingZones.length > 1) {
        stationLogger.warn({matchingZones: matchingZones.map(z => z.feature.properties.name)}, `found multiple matching zones for weather station`);
      } else {
        // Mapped station to a single zone. Now, should it appear in the UI as part of a group?
        const groupMapping = Object.entries(stationGroupMapping).find(([_name, stids]) => stids.includes(s.stid));
        const name = groupMapping ? groupMapping[0] : s.name;
        matchingZones[0].stationGroups[name] = matchingZones[0].stationGroups[name] || [];
        matchingZones[0].stationGroups[name].push(s);
      }
    });
  return zones;
};

const NWACStationList: React.FunctionComponent<{center: AvalancheCenterID; mapLayer: MapLayer; stations: WeatherStationCollection; requestedTime: RequestedTimeString}> = ({
  center,
  mapLayer,
  stations,
  requestedTime,
}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const navigation = useNavigation<WeatherStackNavigationProps>();
  const stationsByZone = NWACStationsByZone(mapLayer, stations, logger);

  const data = stationsByZone
    .map(zone => ({
      zoneName: zone.feature.properties.name,
      actions: Object.entries(zone.stationGroups)
        .map(([k, v]) => ({
          label: k,
          data: v,
          action: (name: string, data: WeatherStationProperties[]) => {
            navigation.navigate('stationDetail', {
              center_id: center,
              stations: data
                .map(s => ({id: s.stid, source: s.source}))
                .reduce((accum, value) => {
                  accum[value.id] = value.source;
                  return accum;
                }, {} as Record<string, WeatherStationSource>),
              name: name,
              requestedTime: requestedTime,
              zoneName: zone.feature.properties.name,
            });
          },
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter(d => d.actions.length > 0);
  return (
    <ScrollView style={{width: '100%', height: '100%'}}>
      <VStack space={8}>
        {data.map((d, i) => (
          <Card borderRadius={0} borderColor="white" header={<Title3Black>{d.zoneName}</Title3Black>} key={i}>
            <ActionList actions={d.actions} />
          </Card>
        ))}
      </VStack>
    </ScrollView>
  );
};
