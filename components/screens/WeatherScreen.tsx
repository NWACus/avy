import React from 'react';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {WeatherStationDetail} from 'components/weather_data/WeatherStationDetail';
import {WeatherStationList} from 'components/weather_data/WeatherStationList';
import {TabNavigatorParamList, WeatherStackParamList} from 'routes';

const WeatherStack = createNativeStackNavigator<WeatherStackParamList>();
export const WeatherScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather Data'>) => {
  const {center_id, dateString} = route.params;
  return (
    <WeatherStack.Navigator initialRouteName="stationList" screenOptions={{headerShown: false}}>
      <WeatherStack.Screen name="stationList" component={StationListScreen} initialParams={{center_id: center_id, dateString}} />
      <WeatherStack.Screen name="stationDetail" component={StationDetailScreen} />
    </WeatherStack.Navigator>
  );
};

const StationListScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationList'>) => {
  return <WeatherStationList {...route.params} />;
};

export const StationDetailScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationDetail'>) => {
  return <WeatherStationDetail {...route.params} />;
};
