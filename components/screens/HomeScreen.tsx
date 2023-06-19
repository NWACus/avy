import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';

import {ForecastScreen} from 'components/screens/ForecastScreen';
import {MapScreen} from 'components/screens/MapScreen';
import {NWACObservationScreen, ObservationScreen} from 'components/screens/ObservationsScreen';
import {StationDetailScreen} from 'components/screens/WeatherScreen';
import {HomeStackParamList, TabNavigatorParamList} from 'routes';

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
export const HomeTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Home'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter" screenOptions={{headerShown: false}}>
      <AvalancheCenterStack.Screen name="avalancheCenter" component={MapScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} />
      <AvalancheCenterStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} />
      <AvalancheCenterStack.Screen name="stationDetail" component={StationDetailScreen} />
      <AvalancheCenterStack.Screen name="observation" component={ObservationScreen} />
      <AvalancheCenterStack.Screen name="nwacObservation" component={NWACObservationScreen} />
    </AvalancheCenterStack.Navigator>
  );
};
