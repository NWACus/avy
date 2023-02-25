import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {TelemetryStationData} from 'components/TelemetryStationData';
import {TelemetryStationMap} from 'components/TelemetryStationMap';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {TabNavigatorParamList, TelemetryStackParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

const TelemetryStack = createNativeStackNavigator<TelemetryStackParamList>();
export const TelemetryTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather Data'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <TelemetryStack.Navigator initialRouteName="telemetryStations">
      <TelemetryStack.Screen
        name="telemetryStations"
        component={TelemetryScreen}
        initialParams={{center_id: center_id, requestedTime}}
        options={() => ({title: `${center_id} Telemetry Stations`})}
      />
      <TelemetryStack.Screen
        name="telemetryStation"
        component={TelemetryStationScreen}
        initialParams={{center_id: center_id, requestedTime}}
        options={({route}) => ({title: String(route.params.name)})}
      />
    </TelemetryStack.Navigator>
  );
};
const TelemetryScreen = ({route}: NativeStackScreenProps<TelemetryStackParamList, 'telemetryStations'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <View style={styles.fullScreen}>
      <TelemetryStationMap center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />
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
