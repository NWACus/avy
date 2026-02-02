import _ from 'lodash';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import centroid from '@turf/centroid';
import turfClustersDBScan from '@turf/clusters-dbscan';
import turfDistance from '@turf/distance';
import {Coord, Units, featureCollection} from '@turf/helpers';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StyleSheet, TouchableOpacity, useWindowDimensions} from 'react-native';

import {format} from 'date-fns';

import {Camera, CircleLayer, ShapeSource} from '@rnmapbox/maps';
import {MapViewZone, ZoneMap, mapViewZoneFor} from 'components/content/ZoneMap';
import {HStack, VStack, View} from 'components/core';
import {defaultMapRegionForGeometries} from 'components/helpers/geographicCoordinates';
import {AnimatedCards, AnimatedDrawerState, AnimatedMapWithDrawerController, CARD_MARGIN, CARD_WIDTH} from 'components/map/AnimatedCards';
import {BodySm, BodySmSemibold, Title3Black} from 'components/text';
import {formatData, formatTime, formatUnits, orderStationVariables} from 'components/weather_data/WeatherStationDetail';
import {formatInTimeZone} from 'date-fns-tz';
import {FeatureCollection, Point} from 'geojson';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {usePostHog} from 'posthog-react-native';
import {WeatherStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {
  AvalancheCenterID,
  DangerLevel,
  MapLayer,
  MapLayerFeature,
  Position,
  StationColorNameForSource,
  Variable,
  WeatherStation,
  WeatherStationCollection,
  WeatherStationSource,
} from 'types/nationalAvalancheCenter';
import {RequestedTime, RequestedTimeString, formatRequestedTime, parseRequestedTimeString} from 'utils/date';

type ClusteredWeatherStation = Omit<WeatherStationCollection['features'][0], 'properties' | 'id'> & {
  // TODO I think our definition of `id` (number | string | null | undefined) might be overly generic relative to the GeoJSON spec
  id: string | undefined;
  properties: WeatherStationCollection['features'][0]['properties'] & {
    cluster: number | null;
    dbscan: 'core' | 'edge' | 'noise';
    clusterCentroid?: Position;
  };
};

type ClusteredWeatherStationCollection = Omit<WeatherStationCollection, 'features'> & {
  features: ClusteredWeatherStation[];
};

function clustersDBScan(
  weatherStations: WeatherStationCollection,
  maxDistance: number,
  options?: {
    units?: Units;
    minPoints?: number;
    mutate?: boolean;
  },
): ClusteredWeatherStationCollection {
  // Turf's types are not genericized for this function, so we have to explicitly cast the result
  const result = turfClustersDBScan(weatherStations as FeatureCollection<Point>, maxDistance, options) as ClusteredWeatherStationCollection;

  // With all features grouped by cluster, calculate the centroid of each cluster and attach it to each feature
  Object.entries(_.groupBy(result.features, f => (f.properties.cluster != null ? f.properties.cluster : -1))).forEach(([cluster, features]) => {
    if (cluster !== '-1') {
      const clusterCentroid = centroid(featureCollection(features));
      features.forEach(f => {
        f.properties.clusterCentroid = clusterCentroid.geometry.coordinates;
      });
    }
  });
  return result;
}

export const WeatherStationMap: React.FunctionComponent<{
  mapLayer: MapLayer;
  weatherStations: WeatherStationCollection;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  toggleList: () => void;
}> = ({mapLayer, weatherStations, center_id, requestedTime, toggleList}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const avalancheCenterMapRegion = defaultMapRegionForGeometries(mapLayer?.features.map(feature => feature.geometry));
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id) {
      postHog.screen('weatherStationsMap', {
        center: center_id,
      });
    }
  }, [postHog, center_id]);
  useFocusEffect(recordAnalytics);

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
  const onPressMapView = useCallback(() => {
    setSelectedStationId(null);
  }, []);

  // useRef has to be used here. Animation and gesture handlers can't use props and state,
  // and aren't re-evaluated on render. Fun!
  const mapCameraView = useRef<Camera>(null);
  const controller = useRef<AnimatedMapWithDrawerController>(
    new AnimatedMapWithDrawerController(AnimatedDrawerState.Hidden, avalancheCenterMapRegion, mapCameraView, logger),
  ).current;
  React.useEffect(() => {
    controller.animateUsingUpdatedAvalancheCenterMapRegion(avalancheCenterMapRegion);
  }, [avalancheCenterMapRegion, controller]);

  // we want light grey zones in the background here
  const zones: MapViewZone[] = mapLayer.features.map((feature: MapLayerFeature) => ({
    ...mapViewZoneFor(center_id, feature),
    hasWarning: false,
    danger_level: DangerLevel.None,
    fillOpacity: 0.1,
  }));

  // Cluster the stations. This generates rough clusters to group things that are widely separated.
  // Ideas for future refinement:
  // - Use a second pass of clustering to get tighter clusters within each mega-cluster
  const clusteredStations = React.useMemo(() => {
    // Create an initial clustering
    const firstPass = clustersDBScan(
      {
        ...weatherStations,
        features: weatherStations.features.map(f => ({...f, id: undefined})),
      },
      35.0, // kilometers
      {minPoints: 2},
    );
    return firstPass;
  }, [weatherStations]);

  const sortedStations = React.useMemo(
    () => ({
      ...clusteredStations,
      features: clusteredStations.features.sort((a, b) => {
        // Sort by cluster...
        const avalancheCenterLongLat: Coord = [avalancheCenterMapRegion.centerCoordinate.longitude, avalancheCenterMapRegion.centerCoordinate.latitude];

        if (a.properties.cluster !== b.properties.cluster) {
          if (a.properties.cluster == null && b.properties.cluster != null) {
            // Sort clustered values ahead of non clustered values
            return 1;
          }
          if (a.properties.cluster != null && b.properties.cluster == null) {
            // Sort clustered values ahead of non clustered values
            return -1;
          }
          if (a.properties.cluster != null && b.properties.cluster != null) {
            // Different clusters, but both clustered
            // Sort clusters by closest to the avalanche center map region
            const aClusterCentroid = a.properties.clusterCentroid ?? [0, 0];
            const bClusterCentroid = b.properties.clusterCentroid ?? [0, 0];
            return turfDistance(avalancheCenterLongLat, aClusterCentroid) - turfDistance(avalancheCenterLongLat, bClusterCentroid);
          }
        }
        // ...then left to right based on longitude
        return turfDistance(avalancheCenterLongLat, a.geometry.coordinates) - turfDistance(avalancheCenterLongLat, b.geometry.coordinates);
      }),
    }),
    [clusteredStations, avalancheCenterMapRegion],
  );

  const markers = React.useMemo(
    () =>
      sortedStations.features.map(station => {
        return <WeatherStationMarker key={station.properties.stid} selected={false} onPressMarker={onPressMarker} station={station} />;
      }),
    [sortedStations, onPressMarker],
  );

  useEffect(() => {
    const station = sortedStations.features.find(station => station.properties.stid === selectedStationId);
    if (station) {
      mapCameraView.current?.moveTo(station.geometry.coordinates, 250);
    }
  }, [selectedStationId, sortedStations]);

  return (
    <>
      <ZoneMap
        style={StyleSheet.absoluteFillObject}
        ref={mapCameraView}
        onMapPress={onPressMapView}
        zoomEnabled={true}
        scrollEnabled={true}
        zones={zones}
        initialCameraBounds={avalancheCenterMapRegion.cameraBounds}>
        {markers}
        {selectedStationId &&
          sortedStations.features
            .filter(station => station.properties.stid === selectedStationId)
            ?.map(selectedStation => (
              <WeatherStationMarker key={`${selectedStation.properties.stid}-selected`} station={selectedStation} selected={true} onPressMarker={onPressMarker} />
            ))}
      </ZoneMap>

      <WeatherStationCards
        key={center_id}
        center_id={center_id}
        date={parseRequestedTimeString(requestedTime)}
        stations={sortedStations}
        selectedStationId={selectedStationId}
        setSelectedStationId={setSelectedStationId}
        controller={controller}
        buttonOnPress={process.env.EXPO_PUBLIC_WEATHER_STATION_LIST_TOGGLE ? toggleList : undefined}
      />
    </>
  );
};

const WeatherStationMarker: React.FC<{
  station: WeatherStation;
  selected: boolean;
  onPressMarker: (station: WeatherStation) => void;
}> = ({station, selected, onPressMarker}) => {
  const onPressHandler = useCallback(() => {
    onPressMarker(station);
  }, [onPressMarker, station]);

  const selectedKeySuffix = selected ? '-selected' : '';

  return (
    <ShapeSource
      key={`${station.properties.stid}-source${selectedKeySuffix}`}
      id={`${station.properties.stid}-source${selectedKeySuffix}`}
      shape={station.geometry}
      onPress={onPressHandler}
      hitbox={{width: 0, height: 0}}>
      <CircleLayer
        id={`${station.properties.stid}-circleLayer${selectedKeySuffix}`}
        key={`${station.properties.stid}-circleLayer${selectedKeySuffix}`}
        style={{
          circleColor: colorLookup(StationColorNameForSource(station.properties.source)).toString(),
          circleRadius: 10,
          circleStrokeColor: selected ? 'white' : colorLookup('text').toString(),
          circleStrokeWidth: 1,
        }}
      />
    </ShapeSource>
  );
};

export const WeatherStationCards: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: RequestedTime;
  stations: WeatherStationCollection;
  selectedStationId: string | null;
  setSelectedStationId: React.Dispatch<React.SetStateAction<string | null>>;
  controller: AnimatedMapWithDrawerController;
  buttonOnPress?: () => void;
}> = ({center_id, date, stations, selectedStationId, setSelectedStationId, controller, buttonOnPress}) => {
  return AnimatedCards<WeatherStation, string>({
    center_id,
    date,
    items: stations.features,
    getItemId: station => station.properties.stid,
    selectedItemId: selectedStationId,
    setSelectedItemId: setSelectedStationId,
    controller,
    renderItem: ({date, center_id, item}) => (
      <WeatherStationCard mode={'map'} center_id={center_id} date={date} station={item} units={stations.properties.units} variables={stations.properties.variables} />
    ),
    buttonOnPress,
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

    const orderedVariables = latestObservation && orderStationVariables(variables);
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
    const onPress = useCallback(() => {
      navigation.navigate('stationDetail', {
        center_id: center_id,
        stationId: station.properties.stid,
        source: station.properties.source,
        requestedTime: formatRequestedTime(date),
      });
    }, [navigation, center_id, station, date]);

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
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
                {formatSource(station.properties.source)} | {station.properties.elevation} ft
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
                        <BodySm>
                          {variable.variable == 'date_time' ? formatTime([data], formatInTimeZone(new Date(), station.properties.timezone, 'z')) : formatData(variable, [data])[0]}
                        </BodySm>
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

const formatSource = (source: WeatherStationSource): string => {
  if (source === WeatherStationSource.MESOWEST) {
    return 'Synoptic Data';
  } else {
    return source.toUpperCase();
  }
};
