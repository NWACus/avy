import React from 'react';
import {StyleSheet} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';
import {AvalancheForecast} from 'components/forecast/AvalancheForecast';
import {AvalancheTab} from 'components/forecast/AvalancheTab';
import {ObservationsTab} from 'components/forecast/ObservationsTab';
import {SynopsisTab} from 'components/forecast/SynopsisTab';
import {WeatherTab} from 'components/forecast/WeatherTab';
import {ForecastTabNavigatorParamList, HomeStackParamList} from 'routes';

export const ForecastScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'forecast'>) => {
  const {center_id, forecast_zone_id, requestedTime} = route.params;
  return (
    // hat tip to https://github.com/react-navigation/react-navigation/issues/8694 for the use of `edges`
    <SafeAreaView style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}} edges={['top', 'left', 'right']}>
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
