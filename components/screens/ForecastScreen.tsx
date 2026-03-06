import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {createMaterialTopTabNavigator, MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';
import {useNavigation} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {View} from 'components/core';
import {AvalancheTab} from 'components/forecast/AvalancheTab';
import {ObservationsTab} from 'components/forecast/ObservationsTab';
import {SynopsisTab} from 'components/forecast/SynopsisTab';
import {WeatherTab} from 'components/forecast/WeatherTab';
import {Body, BodySemibold} from 'components/text';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {ForecastTabNavigatorParamList, HomeStackNavigationProps, HomeStackParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheForecastZone, AvalancheForecastZoneStatus} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTimeString} from 'utils/date';

export const AvalancheForecast: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  forecast_zone_id: number;
}> = ({center_id, requestedTime: requestedTimeString, forecast_zone_id}) => {
  const centerResult = useAvalancheCenterMetadata(center_id);
  const center = centerResult.data;

  const Tab = createMaterialTopTabNavigator<ForecastTabNavigatorParamList>();
  const navigation = useNavigation<HomeStackNavigationProps>();

  const zone: AvalancheForecastZone | undefined = useMemo(() => center?.zones.find(item => item.id === forecast_zone_id), [center?.zones, forecast_zone_id]);

  React.useEffect(() => {
    if (zone?.name) {
      navigation.setOptions({title: `${zone.name}`});
    }
  }, [navigation, zone?.name]);

  if (incompleteQueryState(centerResult) || !center) {
    return <QueryState results={[centerResult]} />;
  }

  if (!zone || zone.status === AvalancheForecastZoneStatus.Disabled) {
    const message = `Avalanche center ${center_id} had no zone with id ${forecast_zone_id}`;
    if (!zone) {
      // If the zone is intentionally disabled, don't log to Sentry
      Sentry.captureException(new Error(message));
    }
    return <NotFound what={[new NotFoundError(message, 'avalanche forecast zone')]} />;
  }

  return (
    <Tab.Navigator
      initialRouteName={'avalanche'}
      screenOptions={{
        tabBarActiveTintColor: colorLookup('primary').toString(),
        tabBarInactiveTintColor: colorLookup('text').toString(),
        tabBarItemStyle: {alignItems: 'stretch'},
      }}>
      <Tab.Screen
        name="avalanche"
        component={AvalancheTabScreen}
        initialParams={{center_id: center_id, forecast_zone_id: forecast_zone_id, requestedTime: requestedTimeString}}
        options={{tabBarLabel: ({focused, color}) => <TabLabel title={'Avalanche'} focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="weather"
        component={WeatherTabScreen}
        initialParams={{center_id: center_id, forecast_zone_id: forecast_zone_id, requestedTime: requestedTimeString}}
        options={{tabBarLabel: ({focused, color}) => <TabLabel title={'Weather'} focused={focused} color={color} />}}
      />
      <Tab.Screen
        name="observations"
        component={ObservationsTabScreen}
        initialParams={{center_id: center_id, forecast_zone_id: forecast_zone_id, requestedTime: requestedTimeString}}
        options={{
          tabBarLabel: ({focused, color}) => <TabLabel title={'Observations'} focused={focused} color={color} />,
        }}
      />
      {process.env.EXPO_PUBLIC_ENABLE_CONDITIONS_BLOG && center.config.blog && center.config.blog_title && (
        <Tab.Screen
          name={'blog'}
          component={SynopsisTabScreen}
          initialParams={{
            center_id: center_id,
            forecast_zone_id: forecast_zone_id,
            requestedTime: requestedTimeString,
          }}
          options={{
            tabBarLabel: ({focused, color}) => <TabLabel title={center.config.blog_title ? center.config.blog_title : 'Blog'} focused={focused} color={color} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const TabLabel: React.FC<{title: string; focused: boolean; color: string}> = ({title, focused, color}) => {
  // the tab view library has a long-standing bug where they don't re-render tabs during focus,
  // so we resort to always rendering the focused (larger) text in order to ensure it does not
  // get cut off, ref:
  // https://github.com/satya164/react-native-tab-view/issues/992
  return (
    <View>
      {focused ? (
        <BodySemibold color={color} textAlign={'center'}>
          {title}
        </BodySemibold>
      ) : (
        <Body color={color} textAlign={'center'}>
          {title}
        </Body>
      )}
      <View style={{height: 0}}>
        <BodySemibold color={'transparent'} textAlign={'center'}>
          {title}
        </BodySemibold>
      </View>
    </View>
  );
};
export const ForecastScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'forecast'>) => {
  const {center_id, forecast_zone_id, requestedTime} = route.params;
  return (
    // hat tip to https://github.com/react-navigation/react-navigation/issues/8694 for the use of `edges`
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}} edges={['left', 'right']}>
      <AvalancheForecast center_id={center_id} forecast_zone_id={forecast_zone_id} requestedTime={requestedTime} />
    </SafeAreaView>
  );
};

export const AvalancheTabScreen = ({route}: MaterialTopTabScreenProps<ForecastTabNavigatorParamList, 'avalanche'>) => {
  const {center_id, forecast_zone_id, requestedTime} = route.params;
  return (
    <SafeAreaView style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}} edges={['left', 'right']}>
      <AvalancheTab center_id={center_id} forecast_zone_id={forecast_zone_id} requestedTime={requestedTime} />
    </SafeAreaView>
  );
};

export const WeatherTabScreen = ({route}: MaterialTopTabScreenProps<ForecastTabNavigatorParamList, 'weather'>) => {
  const {center_id, forecast_zone_id, requestedTime} = route.params;
  return (
    <SafeAreaView style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}} edges={['left', 'right']}>
      <WeatherTab center_id={center_id} forecast_zone_id={forecast_zone_id} requestedTime={requestedTime} />
    </SafeAreaView>
  );
};

export const ObservationsTabScreen = ({route}: MaterialTopTabScreenProps<ForecastTabNavigatorParamList, 'observations'>) => {
  const {center_id, forecast_zone_id, requestedTime} = route.params;
  return (
    <SafeAreaView style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}} edges={['left', 'right']}>
      <ObservationsTab center_id={center_id} forecast_zone_id={forecast_zone_id} requestedTime={requestedTime} />
    </SafeAreaView>
  );
};

export const SynopsisTabScreen = ({route}: MaterialTopTabScreenProps<ForecastTabNavigatorParamList, 'blog'>) => {
  const {center_id, forecast_zone_id, requestedTime} = route.params;
  return (
    <SafeAreaView style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}} edges={['left', 'right']}>
      <SynopsisTab center_id={center_id} forecast_zone_id={forecast_zone_id} requestedTime={requestedTime} />
    </SafeAreaView>
  );
};
