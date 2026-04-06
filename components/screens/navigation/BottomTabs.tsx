import Ionicons from '@expo/vector-icons/Ionicons';
import {BottomTabBarHeightContext, BottomTabHeaderProps, createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RouteProp, useIsFocused} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabNavigationHeader} from 'components/content/BottomTabNavigationHeader';
import {View, VStack} from 'components/core';
import {AvalancheForecastZoneMap} from 'components/map/AvalancheForecastZoneMap';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {WeatherStationPage} from 'components/weather_data/WeatherStationPage';
import * as Updates from 'expo-updates';
import {useEASUpdateStatus} from 'hooks/useEASUpdateStatus';
import {merge} from 'lodash';
import {usePreferences} from 'Preferences';
import React, {useCallback, useEffect} from 'react';
import {Alert, StyleSheet} from 'react-native';
import {Edge, SafeAreaView} from 'react-native-safe-area-context';
import {TabNavigatorParamList} from 'routes';
import {colorLookup} from 'theme';
import {formatRequestedTime, parseRequestedTimeString, RequestedTime} from 'utils/date';

const BottomTabNavigator = createBottomTabNavigator<TabNavigatorParamList>();
export const BottomTabs: React.FunctionComponent<{requestedTime: RequestedTime}> = ({requestedTime}) => {
  const renderHeader = useCallback((props: BottomTabHeaderProps) => <BottomTabNavigationHeader {...props} />, []);

  const {preferences} = usePreferences();
  const centerId = preferences.center;

  const tabNavigatorScreenOptions = useCallback(
    ({route: {name}}: {route: RouteProp<TabNavigatorParamList, keyof TabNavigatorParamList>}) => ({
      tabBarIcon: ({color, size}: {focused: boolean; color: string; size: number}) => {
        if (name === 'Map') {
          return <Ionicons name="map-outline" size={size} color={color} />;
        } else if (name === 'Observations') {
          return <Ionicons name="reader-outline" size={size} color={color} />;
        } else if (name === 'Weather') {
          return <Ionicons name="stats-chart-outline" size={size} color={color} />;
        }
      },
      // these two properties should really take ColorValue but oh well
      tabBarActiveTintColor: colorLookup('primary') as string,
      tabBarInactiveTintColor: colorLookup('text.secondary') as string,
      header: renderHeader,
    }),
    [renderHeader],
  );
  return (
    <BottomTabNavigator.Navigator initialRouteName="Map" screenOptions={tabNavigatorScreenOptions}>
      <BottomTabNavigator.Screen name="Map" initialParams={{center_id: centerId, requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          MapScreen(
            merge(state, {
              route: {
                params: {
                  center_id: centerId,
                  requestedTime: formatRequestedTime(requestedTime),
                },
              },
            }),
          )
        }
      </BottomTabNavigator.Screen>
      <BottomTabNavigator.Screen name="Observations" initialParams={{center_id: centerId, requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          ObservationsListScreen(
            merge(state, {
              route: {
                params: {
                  center_id: centerId,
                  requestedTime: formatRequestedTime(requestedTime),
                },
              },
            }),
          )
        }
      </BottomTabNavigator.Screen>
      <BottomTabNavigator.Screen name="Weather" initialParams={{center_id: centerId, requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          WeatherStationListScreen(
            merge(state, {
              route: {
                params: {
                  center_id: centerId,
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

// MARK: Bottom Tab Screens

const MapScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Map'>) => {
  const updateStatus = useEASUpdateStatus();
  const isActiveScreen = useIsFocused();

  useEffect(() => {
    if (updateStatus === 'update-downloaded' && isActiveScreen) {
      Alert.alert('Update Available', 'A new version of the app is available. Press OK to apply the update.', [
        {
          text: 'OK',
          onPress: () => void Updates.reloadAsync(),
        },
      ]);
    }
  }, [isActiveScreen, updateStatus]);

  const {center_id, requestedTime} = route.params;
  return (
    <BottomTabBarHeightContext.Consumer>
      {tabBarHeight => (
        <View style={{flex: 1}}>
          <AvalancheForecastZoneMap center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} bottomTabBarHeight={tabBarHeight ?? 0} />
        </View>
      )}
    </BottomTabBarHeightContext.Consumer>
  );
};

const ObservationsListScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <View style={{...styles.fullScreen, backgroundColor: 'white'}}>
      <ObservationsListView center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />
    </View>
  );
};

const WeatherStationListScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather'>) => {
  const edges: Edge[] = ['left', 'right'];
  const {center_id, requestedTime} = route.params;

  return (
    <View flex={1} bg="white" key={`${center_id}_weather`}>
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={edges} style={{height: '100%', width: '100%'}}>
        <VStack width="100%" height="100%" justifyContent="space-between" alignItems="stretch" bg="primary.background">
          <WeatherStationPage center_id={center_id} requestedTime={requestedTime} />
        </VStack>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});
