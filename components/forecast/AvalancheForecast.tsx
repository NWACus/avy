import React, {useCallback, useEffect} from 'react';

import {uniq} from 'lodash';

import {ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {HStack, View} from 'components/core';

import {AvalancheCenterID, AvalancheForecastZone, AvalancheForecastZoneSummary} from 'types/nationalAvalancheCenter';
import {Tab, TabControl} from 'components/TabControl';
import {useLatestAvalancheForecast} from 'hooks/useLatestAvalancheForecast';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useRefreshByUser} from 'hooks/useRefreshByUser';

import {AvalancheTab} from './AvalancheTab';
import {Body, FeatureTitleBlack} from 'components/text';
import {Dropdown} from 'components/content/Dropdown';
import {apiDateString} from 'utils/date';
import {HomeStackNavigationProps} from 'routes';
import {AvalancheCenterLogo} from '../AvalancheCenterLogo';
import {WeatherTab} from 'components/forecast/WeatherTab';

export interface AvalancheForecastProps {
  zoneName: string;
  center_id: AvalancheCenterID;
  date: Date;
  forecast_zone_id: number;
}

const ObservationsTab = () => {
  return <FeatureTitleBlack>Observations coming soon</FeatureTitleBlack>;
};

export const AvalancheForecast: React.FunctionComponent<AvalancheForecastProps> = ({center_id, date, forecast_zone_id}: AvalancheForecastProps) => {
  const {isLoading: isCenterLoading, isError: isCenterError, data: center, error: centerError, refetch: refetchCenter} = useAvalancheCenterMetadata(center_id);
  const {
    isLoading: isForecastLoading,
    isError: isForecastError,
    data: forecast,
    error: forecastError,
    refetch: refetchForecast,
  } = useLatestAvalancheForecast(center_id, forecast_zone_id, date); // TODO(skuznets): when we refactor to show previous forecasts, we will need two wrappers for the logic under the fetching, choosing either to fetch the latest, or for a specific date
  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetchCenter, refetchForecast);

  // When navigating from elsewhere in the app, the screen title should already
  // be set to the zone name. But if we warp directly to a forecast link, we
  // need to load the zone name dynamically.
  const navigation = useNavigation<HomeStackNavigationProps>();
  useEffect(() => {
    if (forecast) {
      const thisZone: AvalancheForecastZoneSummary | undefined = forecast.forecast_zone.find(zone => zone.id === forecast_zone_id);
      if (thisZone) {
        navigation.setOptions({title: thisZone.name});
      }
    }
  }, [forecast, forecast_zone_id, navigation]);

  const onZoneChange = useCallback(
    zoneName => {
      if (center) {
        const zone = center?.zones.find(z => z.name === zoneName && z.status === 'active');
        // TODO: consider possible improvements here
        // 1) nice-to-have: make sure we land on the same sub-tab (Avalanche vs Forecast vs Obs)
        // 2) nice-to-have: navigation causes a full reload on this screen - can we just do the equivalent of setState in a browser?
        //    i.e. update the navigation stack, but then manage re-rendering internally. we shouldn't need to re-render the toolbar after making this transition.
        navigation.navigate('forecast', {
          zoneName: zone.name,
          center_id: center_id,
          forecast_zone_id: zone.id,
          dateString: apiDateString(date),
        });
      }
    },
    [navigation, center, center_id, date],
  );

  const onReturnToMapView = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (isForecastLoading || isCenterLoading || !center || !forecast) {
    return <ActivityIndicator />;
  }
  if (isForecastError || isCenterError) {
    return (
      <View>
        {isCenterError && <Body>{`Could not fetch ${center_id} properties: ${centerError?.message}.`}</Body>}
        {isForecastError && <Body>{`Could not fetch forecast for ${center_id} zone ${forecast_zone_id}: ${forecastError?.message}.`}</Body>}
        {/* TODO(brian): we should add a "Try again" button and have that invoke `refetchByUser` */}
      </View>
    );
  }

  const zone: AvalancheForecastZone | undefined = center.zones.find(item => item.id === forecast_zone_id);
  if (!zone) {
    const message = `No such zone ${forecast_zone_id} for center ${center_id}.`;
    Alert.alert('Avalanche forecast zone not found', message, [
      {
        text: 'OK',
      },
    ]);
    return (
      <View>
        <Body>{message}</Body>
      </View>
    );
  }

  const zones = uniq(center.zones.filter(z => z.status === 'active').map(z => z.name));

  return (
    <ScrollView style={StyleSheet.absoluteFillObject} refreshControl={<RefreshControl refreshing={isRefetchingByUser} onRefresh={refetchByUser} />}>
      <HStack justifyContent="space-between" alignItems="center" space={8} width="100%" height={64}>
        <View pl={8} py={8}>
          <TouchableOpacity onPress={onReturnToMapView}>
            <AvalancheCenterLogo style={{height: 48}} avalancheCenterId={center_id} />
          </TouchableOpacity>
        </View>
        <View flex={1} mr={8}>
          <Dropdown items={zones} selectedItem={zone.name} onSelectionChange={onZoneChange} bg="white" height={48} />
        </View>
      </HStack>
      <TabControl backgroundColor="white">
        <Tab title="Avalanche">
          <AvalancheTab zone={zone} forecast={forecast} />
        </Tab>
        <Tab title="Weather">
          <WeatherTab zone={zone} />
        </Tab>
        <Tab title="Observations">
          <ObservationsTab />
        </Tab>
      </TabControl>
    </ScrollView>
  );
};
