import React from 'react';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {NavigationHeader} from 'components/content/NavigationHeader';
import {View, VStack} from 'components/core';
import {WeatherStationDetail} from 'components/weather_data/WeatherStationDetail';
import {WeatherStationPage} from 'components/weather_data/WeatherStationPage';
import {WeatherStationsDetail} from 'components/weather_data/WeatherStationsDetail';
import {Edge, SafeAreaView} from 'react-native-safe-area-context';
import {TabNavigatorParamList, WeatherStackParamList} from 'routes';

const WeatherStack = createNativeStackNavigator<WeatherStackParamList>();
export const WeatherScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather Data'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <WeatherStack.Navigator
      initialRouteName="stationList"
      screenOptions={{
        header: props => <NavigationHeader center_id={center_id} {...props} />,
      }}>
      <WeatherStack.Screen
        name="stationList"
        component={StationListScreen}
        options={{title: 'Weather Stations', header: props => (center_id === 'NWAC' ? <NavigationHeader center_id={center_id} {...props} /> : <></>)}}
        initialParams={{center_id: center_id, requestedTime}}
      />
      <WeatherStack.Screen name="stationsDetail" component={StationsDetailScreen} options={{title: 'Weather Station'}} />
      <WeatherStack.Screen name="stationDetail" component={StationDetailScreen} options={{title: 'Weather Station'}} />
    </WeatherStack.Navigator>
  );
};

const StationListScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationList'>) => {
  const edges: Edge[] = route.params.center_id === 'NWAC' ? ['left', 'right'] : ['left', 'right', 'top'];
  return (
    <View flex={1} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={edges} style={{height: '100%', width: '100%'}}>
        <VStack width="100%" height="100%" justifyContent="space-between" alignItems="stretch" bg="primary.background">
          <WeatherStationPage {...route.params} />
        </VStack>
      </SafeAreaView>
    </View>
  );
};

export const StationsDetailScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationsDetail'>) => {
  return (
    <View flex={1} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there, or top edge since StackHeader is sitting there */}
      <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
        <WeatherStationsDetail {...route.params} />
      </SafeAreaView>
    </View>
  );
};

export const StationDetailScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationDetail'>) => {
  return (
    <View flex={1} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there, or top edge since StackHeader is sitting there */}
      <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
        <WeatherStationDetail {...route.params} />
      </SafeAreaView>
    </View>
  );
};
