import React, {useCallback} from 'react';

import {uniq} from 'lodash';

import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useNavigation} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import {TouchableOpacity} from 'react-native';

import {HStack, View, VStack} from 'components/core';

import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {AvalancheCenterID, AvalancheForecastZone, AvalancheForecastZoneStatus} from 'types/nationalAvalancheCenter';

import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {Dropdown} from 'components/content/Dropdown';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {AvalancheTabScreen, ObservationsTabScreen, SynopsisTabScreen, WeatherTabScreen} from 'components/screens/ForecastScreen';
import {Body} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {ForecastTabNavigatorParamList, HomeStackNavigationProps} from 'routes';
import {NotFoundError} from 'types/requests';
import {parseRequestedTimeString, RequestedTimeString} from 'utils/date';

export const AvalancheForecast: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  forecast_zone_id: number;
}> = ({center_id, requestedTime: requestedTimeString, forecast_zone_id}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const requestedTime = parseRequestedTimeString(requestedTimeString);
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
        // TODO: consider possible improvements here
        // 1) nice-to-have: make sure we land on the same sub-tab (Avalanche vs Forecast vs Obs)
        // 2) nice-to-have: navigation causes a full reload on this screen - can we just do the equivalent of setState in a browser?
        //    i.e. update the navigation stack, but then manage re-rendering internally. we shouldn't need to re-render the toolbar after making this transition.
        navigation.navigate('forecast', {
          center_id: center_id,
          forecast_zone_id: zone.id,
          requestedTime: requestedTimeString,
        });
      }
    },
    [navigation, center, center_id, requestedTime, logger],
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
      <Tab.Navigator initialRouteName={'avalanche'}>
        <Tab.Screen
          name="avalanche"
          component={AvalancheTabScreen}
          initialParams={{center_id: center_id, forecast_zone_id: forecast_zone_id, requestedTime: requestedTimeString}}
          options={{tabBarLabel: 'Avalanche'}}
        />
        <Tab.Screen
          name="weather"
          component={WeatherTabScreen}
          initialParams={{center_id: center_id, forecast_zone_id: forecast_zone_id, requestedTime: requestedTimeString}}
          options={{tabBarLabel: 'Weather'}}
        />
        <Tab.Screen
          name="observations"
          component={ObservationsTabScreen}
          initialParams={{center_id: center_id, forecast_zone_id: forecast_zone_id, requestedTime: requestedTimeString}}
          options={{tabBarLabel: 'Observations'}}
        />
        {process.env.EXPO_PUBLIC_ENABLE_CONDITIONS_BLOG && center.config.blog && center.config.blog_title && (
          <Tab.Screen
            name={'blog'}
            component={SynopsisTabScreen}
            initialParams={{center_id: center_id, forecast_zone_id: forecast_zone_id, requestedTime: requestedTimeString}}
            options={{tabBarLabel: center.config.blog_title ? center.config.blog_title : 'Blog'}}
          />
        )}
      </Tab.Navigator>
    </VStack>
  );
};
