import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {TelemetryStackParamList} from 'routes';
import {StyleSheet, View} from 'react-native';
import {TelemetryStationData} from 'components/TelemetryStationData';
import React from 'react';
import {TelemetryStationMap} from 'components/TelemetryStationMap';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

const TelemetryStack = createNativeStackNavigator<TelemetryStackParamList>();
export interface TelemetryTabScreenProps {
  defaultCenterId: AvalancheCenterID;
  defaultDateString: string;
}
export const TelemetryTabScreen = ({defaultCenterId, defaultDateString}: TelemetryTabScreenProps) => {
  return (
    <TelemetryStack.Navigator initialRouteName="telemetryStations">
      <TelemetryStack.Screen
        name="telemetryStations"
        component={TelemetryScreen}
        initialParams={{center_id: defaultCenterId, dateString: defaultDateString}}
        options={({route: {params}}) => ({title: `${params.center_id} Telemetry Stations`})}
      />
      <TelemetryStack.Screen name="telemetryStation" component={TelemetryStationScreen} options={({route}) => ({title: String(route.params.name)})} />
    </TelemetryStack.Navigator>
  );
};
const TelemetryScreen = ({route}: NativeStackScreenProps<TelemetryStackParamList, 'telemetryStations'>) => {
  const {center_id, dateString} = route.params;
  return (
    <View style={styles.fullScreen}>
      <TelemetryStationMap center_id={center_id} date={new Date(dateString)} />
    </View>
  );
};
const TelemetryStationScreen = ({route}: NativeStackScreenProps<TelemetryStackParamList, 'telemetryStation'>) => {
  const {center_id, source, station_id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <TelemetryStationData center_id={center_id} source={source} station_id={station_id} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
