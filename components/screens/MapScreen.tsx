import React from 'react';
import {StyleSheet, View} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AvalancheForecastZoneMap} from 'components/AvalancheForecastZoneMap';
import {useEASUpdateChecker} from 'hooks/useEASUpdateChecker';
import {HomeStackParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

export const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const updateAvailable = useEASUpdateChecker();

  const {center_id, requestedTime} = route.params;
  return (
    <View style={{...styles.container, borderWidth: updateAvailable ? 4 : undefined, borderColor: updateAvailable ? 'blue' : undefined}}>
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
