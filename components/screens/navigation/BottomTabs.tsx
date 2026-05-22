import Ionicons from '@expo/vector-icons/Ionicons';
import {BottomTabBarHeightContext, BottomTabBarProps, BottomTabHeaderProps, createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RouteProp, useFocusEffect, useIsFocused, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AnimatedBottomTabBar} from 'components/content/navigation/AnimatedBottomTabBar';
import {BottomTabNavigationHeader} from 'components/content/navigation/BottomTabNavigationHeader';
import {View} from 'components/core';
import {AvalancheForecastZoneMap} from 'components/map/AvalancheForecastZoneMap';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {WeatherStationPage} from 'components/weather_data/WeatherStationPage';
import * as Updates from 'expo-updates';
import {useEASUpdateStatus} from 'hooks/useEASUpdateStatus';
import {merge} from 'lodash';
import React, {useCallback, useEffect} from 'react';
import {Alert, StyleSheet} from 'react-native';
import {TabNavigatorParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, parseRequestedTimeString, RequestedTime} from 'utils/date';

const BottomTabNavigator = createBottomTabNavigator<TabNavigatorParamList>();
export const BottomTabs: React.FunctionComponent<{requestedTime: RequestedTime; center: AvalancheCenterID; isInNoCenterExperience: boolean}> = ({
  requestedTime,
  center,
  isInNoCenterExperience,
}) => {
  const navigation = useNavigation();
  // Drawer swipe is disabled by default so it doesn't intercept the native stack back-swipe on detail screens.
  // Re-enable it here so swipe-to-open still works from the top-level tab screens.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({swipeEnabled: true});
      return () => {
        navigation.getParent()?.setOptions({swipeEnabled: false});
      };
    }, [navigation]),
  );

  const renderHeader = useCallback((props: BottomTabHeaderProps) => <BottomTabNavigationHeader centerId={center} {...props} />, [center]);
  const renderCustomTabBar = useCallback((props: BottomTabBarProps) => <AnimatedBottomTabBar isVisible={!isInNoCenterExperience} {...props} />, [isInNoCenterExperience]);

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
      headerShown: name !== 'Map',
      header: name !== 'Map' ? renderHeader : undefined,
    }),
    [renderHeader],
  );

  return (
    <BottomTabNavigator.Navigator initialRouteName="Map" screenOptions={tabNavigatorScreenOptions} tabBar={renderCustomTabBar}>
      <BottomTabNavigator.Screen name="Map" initialParams={{center_id: center, requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          MapScreen(
            merge(state, {
              route: {
                params: {
                  center_id: center,
                  requestedTime: formatRequestedTime(requestedTime),
                },
              },
            }),
          )
        }
      </BottomTabNavigator.Screen>
      <BottomTabNavigator.Screen name="Observations" initialParams={{center_id: center, requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          ObservationsListScreen(
            merge(state, {
              route: {
                params: {
                  center_id: center,
                  requestedTime: formatRequestedTime(requestedTime),
                },
              },
            }),
          )
        }
      </BottomTabNavigator.Screen>
      <BottomTabNavigator.Screen name="Weather" initialParams={{center_id: center, requestedTime: formatRequestedTime(requestedTime)}}>
        {state =>
          WeatherStationListScreen(
            merge(state, {
              route: {
                params: {
                  center_id: center,
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
    <View style={{flex: 1}}>
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => <AvalancheForecastZoneMap center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} tabBarHeight={tabBarHeight ?? 0} />}
      </BottomTabBarHeightContext.Consumer>
    </View>
  );
};

const ObservationsListScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {center_id, requestedTime} = route.params;

  return (
    <View style={{...styles.fullScreen, backgroundColor: 'white'}}>
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => <ObservationsListView center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} tabBarHeight={tabBarHeight} />}
      </BottomTabBarHeightContext.Consumer>
    </View>
  );
};

const WeatherStationListScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Weather'>) => {
  const {center_id, requestedTime} = route.params;

  return (
    <View flex={1} bg="white" key={`${center_id}_weather`}>
      <BottomTabBarHeightContext.Consumer>
        {tabBarHeight => <WeatherStationPage center_id={center_id} requestedTime={requestedTime} tabBarHeight={tabBarHeight ?? 0} />}
      </BottomTabBarHeightContext.Consumer>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});
