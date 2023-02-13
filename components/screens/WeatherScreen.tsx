import React from 'react';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {TabNavigatorParamList, WeatherStackParamList} from 'routes';
import {WeatherStationDetail} from 'components/weather_data/WeatherStationDetail';
import {WeatherStationList} from 'components/weather_data/WeatherStationList';

const WeatherStack = createNativeStackNavigator<WeatherStackParamList>();
export const WeatherScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather Data'>) => {
  const {center_id, dateString} = route.params;
  return (
    <WeatherStack.Navigator initialRouteName="stationList">
      <WeatherStack.Screen
        name="stationList"
        component={StationListScreen}
        initialParams={{center_id: center_id, dateString}}
        options={({route: {params}}) => ({title: `${params.center_id} Weather Stations`})}
      />
      <WeatherStack.Screen name="stationDetail" component={StationDetailScreen} options={{headerShown: false}} />
    </WeatherStack.Navigator>
  );
};

const StationListScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationList'>) => {
  return <WeatherStationList {...route.params} />;
};

const StationDetailScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationDetail'>) => {
  return <WeatherStationDetail {...route.params} />;
};
