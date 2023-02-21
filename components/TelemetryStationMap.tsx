import React from 'react';

import {FontAwesome5} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {CARD_MARGIN, CARD_SPACING, CARD_WIDTH} from 'components/AvalancheForecastZoneMap';
import {regionFromBounds, updateBoundsToContain} from 'components/helpers/geographicCoordinates';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useStations} from 'hooks/useStations';
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewStyle} from 'react-native';
import MapView, {Marker, Region} from 'react-native-maps';
import {TelemetryStackNavigationProps} from 'routes';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {StationMetadata} from 'types/snowbound';
import {toISOStringUTC} from 'utils/date';

export const TelemetryStationMap: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: Date;
}> = ({center_id, date}) => {
  const {width} = useWindowDimensions();
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [isList, setIsList] = React.useState<boolean>(false);

  function toggleList() {
    setIsList(v => !v);
  }

  function setReady() {
    setIsReady(true);
  }

  const {isLoading: isMetadataLoading, isError: isMetadataError, data: avalancheCenter, error: metadataError} = useAvalancheCenterMetadata(center_id);

  const [page, setPage] = React.useState<number>(1);
  const [telemetryStations, setTelemetryStations] = React.useState<Record<number, StationMetadata>>({}); // Set uses === for equality, and we need by ID
  const {isLoading: isStationLoading, isError: isStationError, data: stations, error: stationError} = useStations(avalancheCenter?.widget_config?.stations?.token, page);

  // TODO: when switching between centers, this pagination impl keeps previous centers' stations :|
  React.useEffect(() => {
    if (stations) {
      const newStations: Record<number, StationMetadata> = {};
      stations.results.map(station => (newStations[station.id] = station));
      setTelemetryStations(previous => ({...previous, ...newStations}));
      if (stations.current_page < stations.pages) {
        setPage(previous => previous + 1);
      }
    }
  }, [stations]);

  const region: Region = regionFromBounds(
    updateBoundsToContain(
      {
        topLeft: {latitude: 0, longitude: 0},
        bottomRight: {latitude: 0, longitude: 0},
      },
      stations?.results.map(station => ({latitude: station.latitude, longitude: station.longitude})),
    ),
  );

  const largerRegion: Region = {
    latitude: region.latitude,
    longitude: region.longitude,
    latitudeDelta: 1.05 * region.latitudeDelta,
    longitudeDelta: 1.05 * region.longitudeDelta,
  };

  if (isMetadataLoading || isStationLoading) {
    return <ActivityIndicator />;
  }
  if (isMetadataError || isStationError) {
    return (
      <View>
        {isMetadataError && <Text>{`Could not fetch ${center_id} properties: ${metadataError?.message}.`}</Text>}
        {isStationError && <Text>{`Could not fetch telemetry stations for ${center_id}: ${stationError?.message}.`}</Text>}
      </View>
    );
  }

  if (isList) {
    return (
      <>
        <FlatList
          data={Object.values(telemetryStations).map(station => ({
            id: station.id,
            station: station,
          }))}
          renderItem={({item}) => <TelemetryStationCard center_id={center_id} date={date} station={item.station} style={styles.verticalCard} />}
        />
        <TouchableOpacity onPress={toggleList}>
          <View style={styles.toggle}>
            <FontAwesome5 name={'map'} size={32} />
          </View>
        </TouchableOpacity>
      </>
    );
  } else {
    return (
      <>
        <MapView style={styles.map} region={largerRegion} onLayout={setReady} provider={'google'}>
          {isReady &&
            Object.values(telemetryStations).map(station => (
              <Marker
                key={station.id}
                title={station.name}
                coordinate={{
                  latitude: station.latitude,
                  longitude: station.longitude,
                }}
              />
            ))}
        </MapView>
        <View style={styles.footer}>
          <FlatList
            horizontal={true}
            snapToAlignment={'start'}
            decelerationRate={'fast'}
            snapToOffsets={Object.values(telemetryStations).map((station, index) => index * CARD_WIDTH * width + (index - 1) * CARD_SPACING * width)}
            contentInset={{
              left: CARD_MARGIN * width,
              right: CARD_MARGIN * width,
            }}
            contentContainerStyle={{paddingHorizontal: CARD_MARGIN * width}}
            data={Object.values(telemetryStations).map(station => ({
              id: station.id,
              station: station,
            }))}
            renderItem={({item}) => <TelemetryStationCard center_id={center_id} date={date} station={item.station} style={styles.verticalCard} />}
          />
          <TouchableOpacity onPress={toggleList}>
            <View style={styles.toggle}>
              <FontAwesome5 name={'list-ul'} size={32} />
            </View>
          </TouchableOpacity>
        </View>
      </>
    );
  }
};

export const TelemetryStationCard: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: Date;
  station: StationMetadata;
  style: ViewStyle;
}> = ({center_id, date, station, style}) => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation<TelemetryStackNavigationProps>();
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('telemetryStation', {
          center_id: center_id,
          source: station.source,
          station_id: station.stid,
          name: station.name,
          dateString: toISOStringUTC(date),
        });
      }}
      style={{
        width: width * CARD_WIDTH,
        marginRight: CARD_MARGIN * width,
        marginLeft: CARD_MARGIN * width,
        ...style,
      }}>
      <View style={styles.header}>
        <Text style={styles.title}>{station.source + ' ' + station.name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  legend: {
    backgroundColor: 'white',
    padding: 2,
    margin: 2,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
    position: 'absolute',
    width: '100%',
    top: 0,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  legendTitle: {
    padding: 2,
    fontWeight: 'bold',
  },
  legendItems: {
    width: '100%',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  legendMarker: {
    padding: 2,
    marginLeft: 2,
    marginRight: 2,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
  footer: {
    position: 'absolute',
    width: '100%',
    height: '30%',
    bottom: 2,
    justifyContent: 'flex-start',
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
  },
  horizontalCard: {
    padding: 2,
    borderStyle: 'solid',
    backgroundColor: 'white',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
  verticalCard: {
    width: '100%',
    padding: 2,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
  header: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  icon: {
    height: 50,
  },
  title: {
    fontWeight: 'bold',
  },
  toggle: {
    backgroundColor: 'white',
    padding: 2,
    margin: 5,
    borderStyle: 'solid',
    borderWidth: 1.2,
    borderColor: 'rgb(200,202,206)',
    shadowOffset: {width: 1, height: 2},
    shadowOpacity: 0.8,
    shadowColor: 'rgb(157,162,165)',
    borderRadius: 5,
  },
});
