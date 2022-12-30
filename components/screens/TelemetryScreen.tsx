import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {TabNavigatorParamList, TelemetryStackParamList} from 'routes';
import {StyleSheet, View} from 'react-native';
import {TelemetryStationData} from 'components/TelemetryStationData';
import React from 'react';
import {TelemetryStationMap} from 'components/TelemetryStationMap';

const TelemetryStack = createNativeStackNavigator<TelemetryStackParamList>();
export const TelemetryTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather Data'>) => {
  const {center_id, date} = route.params;
  return (
    <TelemetryStack.Navigator initialRouteName="telemetryStations">
      <TelemetryStack.Screen
        name="telemetryStations"
        component={TelemetryScreen}
        initialParams={{center_id: center_id, date: date}}
        options={() => ({title: `${center_id} Telemetry Stations`})}
      />
      <TelemetryStack.Screen
        name="telemetryStation"
        component={TelemetryStationScreen}
        initialParams={{center_id: center_id, date: date}}
        options={({route}) => ({title: String(route.params.name)})}
      />
    </TelemetryStack.Navigator>
  );
};
const TelemetryScreen = ({route}: NativeStackScreenProps<TelemetryStackParamList, 'telemetryStations'>) => {
  const {center_id, date} = route.params;
  return (
    <View style={styles.fullScreen}>
      <TelemetryStationMap center_id={center_id} date={date} />
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
