import React, {useEffect} from 'react';
import {Alert, StyleSheet, View} from 'react-native';

import * as Updates from 'expo-updates';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AvalancheForecastZoneMap} from 'components/AvalancheForecastZoneMap';
import {useEASUpdateStatus} from 'hooks/useEASUpdateStatus';
import {HomeStackParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

export const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const updateStatus = useEASUpdateStatus();

  useEffect(() => {
    if (updateStatus === 'update-downloaded') {
      Alert.alert('Update Available', 'A new version of the app is available. Press OK to apply the update.', [
        {
          text: 'OK',
          onPress: () => void Updates.reloadAsync(),
        },
      ]);
    }
  }, [updateStatus]);

  const {center_id, requestedTime} = route.params;
  return (
    <View style={styles.container}>
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
