import React from 'react';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {NavigationHeader} from 'components/content/NavigationHeader';
import {HStack, View, VStack} from 'components/core';
import {Title1Black} from 'components/text';
import {WeatherStationDetail} from 'components/weather_data/WeatherStationDetail';
import {WeatherStationList} from 'components/weather_data/WeatherStationList';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TabNavigatorParamList, WeatherStackParamList} from 'routes';

const WeatherStack = createNativeStackNavigator<WeatherStackParamList>();
export const WeatherScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather Data'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <WeatherStack.Navigator
      initialRouteName="stationList"
      screenOptions={{
        header: props => <NavigationHeader {...props} />,
      }}>
      <WeatherStack.Screen name="stationList" component={StationListScreen} initialParams={{center_id: center_id, requestedTime}} options={{headerShown: false}} />
      <WeatherStack.Screen name="stationDetail" component={StationDetailScreen} options={{title: 'Weather Station'}} />
    </WeatherStack.Navigator>
  );
};

const StationListScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationList'>) => {
  return (
    <View style={{...StyleSheet.absoluteFillObject}} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
        <VStack width="100%" height="100%" justifyContent="space-between" alignItems="stretch" bg="background.base">
          <HStack width="100%" py={8} px={16} bg="white">
            <Title1Black>Weather Stations</Title1Black>
          </HStack>
          <WeatherStationList {...route.params} />
        </VStack>
      </SafeAreaView>
    </View>
  );
};

export const StationDetailScreen = ({route}: NativeStackScreenProps<WeatherStackParamList, 'stationDetail'>) => {
  return (
    <View style={{...StyleSheet.absoluteFillObject}} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there, or top edge since StackHeader is sitting there */}
      <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
        <WeatherStationDetail {...route.params} />
      </SafeAreaView>
    </View>
  );
};
