import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {TabNavigatorParamList, WeatherStackParamList} from 'routes';
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {Body} from 'components/text';

const WeatherStack = createNativeStackNavigator<WeatherStackParamList>();
export const WeatherScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather Data'>) => {
  const {center_id, dateString} = route.params;
  return (
    <WeatherStack.Navigator initialRouteName="stationList">
      <WeatherStack.Screen
        name="stationList"
        component={StationListScreen}
        initialParams={{center_id: center_id, dateString}}
        options={() => ({title: `${center_id} Weather Stations`})}
      />
      <WeatherStack.Screen
        name="stationDetail"
        component={StationDetailScreen}
        initialParams={{center_id: center_id, dateString}}
        options={({route}) => ({title: String(route.params.name)})}
      />
    </WeatherStack.Navigator>
  );
};
const StationListScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationList'>) => {
  const {center_id, dateString} = route.params;
  return (
    <View style={styles.fullScreen}>
      <Body>
        Weather station list {center_id} {dateString}
      </Body>
    </View>
  );
};

const StationDetailScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationDetail'>) => {
  const {center_id, source, station_id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <Body>
        Weather station detail {center_id} {station_id} {source}
      </Body>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
