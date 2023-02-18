import React, {useCallback, useEffect} from 'react';

import {uniq} from 'lodash';

import {ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {HStack, View, VStack} from 'components/core';

import {AvalancheCenterID, AvalancheForecastZone, AvalancheForecastZoneSummary} from 'types/nationalAvalancheCenter';
import {Tab, TabControl} from 'components/TabControl';
import {useLatestAvalancheForecast} from 'hooks/useLatestAvalancheForecast';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useRefreshByUser} from 'hooks/useRefreshByUser';

import {AvalancheTab} from './AvalancheTab';
import {Body, FeatureTitleBlack} from 'components/text';
import {Dropdown} from 'components/content/Dropdown';
import {toISOStringUTC} from 'utils/date';
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
          dateString: toISOStringUTC(date),
        });
      }
    },
    [navigation, center, center_id, date],
  );

  const onReturnToMapView = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (isForecastLoading || isCenterLoading) {
    return (
      <HStack space={8} style={{flex: 1}}>
        <VStack space={8} style={{flex: 1}} alignItems={'center'}>
          <Body>
            Loading current {center_id} avalanche forecast for zone {forecast_zone_id}...
          </Body>
          <ActivityIndicator />
        </VStack>
      </HStack>
    );
  }
  if (!center) {
    return (
      <HStack space={8} style={{flex: 1}}>
        <VStack space={8} style={{flex: 1}} alignItems={'center'}>
          <Body>Could not fetch {center_id} properties: avalanche center not found.</Body>
        </VStack>
      </HStack>
    );
  }

  const zone: AvalancheForecastZone | undefined = center.zones.find(item => item.id === forecast_zone_id);
  if (!zone) {
    return (
      <HStack space={8} style={{flex: 1}}>
        <VStack space={8} style={{flex: 1}} alignItems={'center'}>
          <Body>
            Could not find zone {forecast_zone_id} for center {center_id}.
          </Body>
        </VStack>
      </HStack>
    );
  }

  if (!forecast) {
    return (
      <HStack space={8} style={{flex: 1}}>
        <VStack space={8} style={{flex: 1}} alignItems={'center'}>
          <Body>
            No current {center_id} avalanche forecast found for the {zone.name} zone.
          </Body>
        </VStack>
      </HStack>
    );
  }
  if (isForecastError || isCenterError) {
    return (
      <HStack space={8} style={{flex: 1}}>
        <VStack space={8} style={{flex: 1}} alignItems={'center'}>
          {isCenterError && <Body>{`Could not fetch ${center_id} properties: ${centerError?.message}.`}</Body>}
          {isForecastError && <Body>{`Could not fetch forecast for ${center_id} zone ${forecast_zone_id}: ${forecastError?.message}.`}</Body>}
          {/* TODO(brian): we should add a "Try again" button and have that invoke `refetchByUser` */}
        </VStack>
      </HStack>
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
          <WeatherTab zone={zone} center_id={center_id} date={date} />
        </Tab>
        <Tab title="Observations">
          <ObservationsTab />
        </Tab>
      </TabControl>
    </ScrollView>
  );
};
