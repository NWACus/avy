import React from 'react';
import {StyleSheet, View} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AvalancheForecastZoneMap} from 'components/AvalancheForecastZoneMap';
import {HomeStackParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

export const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <View style={{...styles.container}}>
      <AvalancheForecastZoneMap center={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
