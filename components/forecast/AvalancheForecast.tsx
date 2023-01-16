import React, {useEffect} from 'react';

import {ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {View} from 'components/core';

import {parseISO} from 'date-fns';

import {AvalancheCenterID, AvalancheForecastZone, AvalancheForecastZoneSummary} from 'types/nationalAvalancheCenter';
import {Tab, TabControl} from 'components/TabControl';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useRefreshByUser} from 'hooks/useRefreshByUser';

import {AvalancheTab} from './AvalancheTab';
import {Body, FeatureTitleBlack} from 'components/text';

export interface AvalancheForecastProps {
  zoneName: string;
  center_id: AvalancheCenterID;
  date: string;
  forecast_zone_id: number;
}

const WeatherTab = () => {
  return <FeatureTitleBlack>Weather coming soon</FeatureTitleBlack>;
};

const ObservationsTab = () => {
  return <FeatureTitleBlack>Observations coming soon</FeatureTitleBlack>;
};

export const AvalancheForecast: React.FunctionComponent<AvalancheForecastProps> = ({center_id, date, forecast_zone_id}: AvalancheForecastProps) => {
  const forecastDate: Date = parseISO(date);

  const {isLoading: isCenterLoading, isError: isCenterError, data: center, error: centerError, refetch: refetchCenter} = useAvalancheCenterMetadata(center_id);
  const {
    isLoading: isForecastLoading,
    isError: isForecastError,
    data: forecast,
    error: forecastError,
    refetch: refetchForecast,
  } = useAvalancheForecast(center_id, forecast_zone_id, forecastDate);
  const {isRefetchingByUser, refetchByUser} = useRefreshByUser(refetchCenter, refetchForecast);

  // When navigating from elsewhere in the app, the screen title should already
  // be set to the zone name. But if we warp directly to a forecast link, we
  // need to load the zone name dynamically.
  const navigation = useNavigation();
  useEffect(() => {
    if (forecast) {
      const thisZone: AvalancheForecastZoneSummary | undefined = forecast.forecast_zone.find(zone => zone.id === forecast_zone_id);
      if (thisZone) {
        navigation.setOptions({title: thisZone.name});
      }
    }
  }, [forecast, forecast_zone_id, navigation]);

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

  return (
    <ScrollView style={StyleSheet.absoluteFillObject} refreshControl={<RefreshControl refreshing={isRefetchingByUser} onRefresh={refetchByUser} />}>
      <TabControl backgroundColor="white">
        <Tab title="Avalanche">
          <AvalancheTab zone={zone} forecast={forecast} />
        </Tab>
        <Tab title="Weather">
          <WeatherTab />
        </Tab>
        <Tab title="Observations">
          <ObservationsTab />
        </Tab>
      </TabControl>
    </ScrollView>
  );
};
