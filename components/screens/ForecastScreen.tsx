import React, {useCallback} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {createMaterialTopTabNavigator, MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';
import {useNavigation} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {Dropdown} from 'components/content/Dropdown';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {AvalancheTab} from 'components/forecast/AvalancheTab';
import {ObservationsTab} from 'components/forecast/ObservationsTab';
import {SynopsisTab} from 'components/forecast/SynopsisTab';
import {WeatherTab} from 'components/forecast/WeatherTab';
import {Body, BodySemibold} from 'components/text';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {uniq} from 'lodash';
import {LoggerContext, LoggerProps} from 'loggerContext';
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
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const centerResult = useAvalancheCenterMetadata(center_id);
  const center = centerResult.data;

  const Tab = createMaterialTopTabNavigator<ForecastTabNavigatorParamList>();
  const navigation = useNavigation<HomeStackNavigationProps>();
  const onZoneChange = useCallback(
    (zoneName: string) => {
      if (center) {
        const zone = center?.zones.find(z => z.name === zoneName && z.status === AvalancheForecastZoneStatus.Active);
        if (!zone) {
          logger.warn({zone: zoneName}, 'zone change callback called with zone not belonging to the center');
          return;
        }
        setTimeout(
          // entirely unclear why this needs to be in a setTimeout, but the app crashes without it
          // https://github.com/react-navigation/react-navigation/issues/11201
          () =>
            navigation.replace('forecast', {
              center_id: center_id,
              forecast_zone_id: zone.id,
              requestedTime: requestedTimeString,
            }),
          0,
        );
      }
    },
    [navigation, center, center_id, requestedTimeString, logger],
  );

  const onReturnToMapView = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (incompleteQueryState(centerResult) || !center) {
    return <QueryState results={[centerResult]} />;
  }

  const zone: AvalancheForecastZone | undefined = center.zones.find(item => item.id === forecast_zone_id);
  if (!zone || zone.status === AvalancheForecastZoneStatus.Disabled) {
    const message = `Avalanche center ${center_id} had no zone with id ${forecast_zone_id}`;
    if (!zone) {
      // If the zone is intentionally disabled, don't log to Sentry
      Sentry.captureException(new Error(message));
    }
    return <NotFound what={[new NotFoundError(message, 'avalanche forecast zone')]} />;
  }

  const zones = uniq(center.zones.filter(z => z.status === AvalancheForecastZoneStatus.Active).map(z => z.name));

  return (
    <VStack style={{height: '100%', width: '100%', justifyContent: 'space-between'}}>
      <HStack justifyContent="space-between" alignItems="center" space={8} width="100%" height={64}>
        <View pl={8} py={8}>
          <TouchableOpacity onPress={onReturnToMapView}>
            <AvalancheCenterLogo style={{height: 48}} avalancheCenterId={center_id} />
          </TouchableOpacity>
        </View>
        <View flex={1} mr={8}>
          {zones.length > 1 ? (
            <Dropdown items={zones} selectedItem={zone.name} onSelectionChange={onZoneChange} bg="white" height={48} />
          ) : (
            <HStack justifyContent="space-around" alignItems="center" height={48}>
              <Body>{zones[0]}</Body>
            </HStack>
          )}
        </View>
      </HStack>
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
    </VStack>
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
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}} edges={['top', 'left', 'right']}>
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
