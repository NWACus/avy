import Ionicons from '@expo/vector-icons/Ionicons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RouteProp} from '@react-navigation/native';
import {HomeTabScreen} from 'components/screens/HomeScreen';
import {ObservationsTabScreen} from 'components/screens/ObservationsScreen';
import {WeatherScreen} from 'components/screens/WeatherScreen';
import {merge} from 'lodash';
import React, {useCallback} from 'react';
import {TabNavigatorParamList} from 'routes';
import {colorLookup} from 'theme';
import {formatRequestedTime, RequestedTime} from 'utils/date';

const BottomTabNavigator = createBottomTabNavigator<TabNavigatorParamList>();
export const BottomTabs: React.FunctionComponent<{requestedTime: RequestedTime}> = ({requestedTime}) => {
  const tabNavigatorScreenOptions = useCallback(
    ({route: {name}}: {route: RouteProp<TabNavigatorParamList, keyof TabNavigatorParamList>}) => ({
      headerShown: false,
      tabBarIcon: ({color, size}: {focused: boolean; color: string; size: number}) => {
        if (name === 'Home') {
          return <Ionicons name="map-outline" size={size} color={color} />;
        } else if (name === 'Observations') {
          return <Ionicons name="reader-outline" size={size} color={color} />;
        } else if (name === 'Weather Data') {
          return <Ionicons name="stats-chart-outline" size={size} color={color} />;
        }
      },
      // these two properties should really take ColorValue but oh well
      tabBarActiveTintColor: colorLookup('primary') as string,
      tabBarInactiveTintColor: colorLookup('text.secondary') as string,
    }),
    [],
  );
  return (
    <BottomTabNavigator.Navigator initialRouteName="Home" screenOptions={tabNavigatorScreenOptions}>
      <BottomTabNavigator.Screen name="Home" initialParams={{requestedTime: formatRequestedTime(requestedTime)}} options={{title: 'Zones'}}>
        {state =>
          HomeTabScreen(
            merge(state, {
              route: {
                params: {
                  requestedTime: formatRequestedTime(requestedTime),
                },
              },
            }),
          )
        }
      </BottomTabNavigator.Screen>
      <BottomTabNavigator.Screen name="Observations" initialParams={{requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          ObservationsTabScreen(
            merge(state, {
              route: {
                params: {
                  requestedTime: formatRequestedTime(requestedTime),
                },
              },
            }),
          )
        }
      </BottomTabNavigator.Screen>
      <BottomTabNavigator.Screen name="Weather Data" initialParams={{requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          WeatherScreen(
            merge(state, {
              route: {
                params: {
                  requestedTime: formatRequestedTime(requestedTime),
                },
              },
            }),
          )
        }
      </BottomTabNavigator.Screen>
    </BottomTabNavigator.Navigator>
  );
};
