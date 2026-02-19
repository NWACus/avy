import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';

import {NavigationHeader} from 'components/content/NavigationHeader';
import {ForecastScreen} from 'components/screens/ForecastScreen';
import {MapScreen} from 'components/screens/MapScreen';
import {NWACObservationScreen, ObservationScreen, ObservationSubmitScreen} from 'components/screens/ObservationsScreen';
import {StationDetailScreen, StationsDetailScreen} from 'components/screens/WeatherScreen';
import {usePreferences} from 'Preferences';
import {HomeStackParamList, TabNavigatorParamList} from 'routes';

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
export const HomeTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Home'>) => {
  const {requestedTime} = route.params;
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter" screenOptions={{header: props => <NavigationHeader center_id={center_id} {...props} />}}>
      <AvalancheCenterStack.Screen
        name="avalancheCenter"
        component={MapScreen}
        initialParams={{center_id: center_id, requestedTime: requestedTime}}
        options={{headerShown: false}}
      />
      <AvalancheCenterStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} options={{headerShown: false}} />
      <AvalancheCenterStack.Screen
        name="stationsDetail"
        component={StationsDetailScreen}
        options={{title: 'Weather Station', header: props => <NavigationHeader center_id={center_id} {...props} />}}
      />
      <AvalancheCenterStack.Screen
        name="stationDetail"
        component={StationDetailScreen}
        options={{title: 'Weather Station', header: props => <NavigationHeader center_id={center_id} {...props} />}}
      />
      <AvalancheCenterStack.Screen
        name="observation"
        component={ObservationScreen}
        options={{
          title: 'Observation',
        }}
      />
      <AvalancheCenterStack.Screen
        name="nwacObservation"
        component={NWACObservationScreen}
        options={{
          title: 'Observation',
        }}
      />
      <AvalancheCenterStack.Screen
        name="observationSubmit"
        component={ObservationSubmitScreen}
        options={{
          title: 'Submit an Observation',
        }}
      />
    </AvalancheCenterStack.Navigator>
  );
};
