import React from 'react';
import {StyleSheet, View} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AvalancheForecastZoneMap} from 'components/AvalancheForecastZoneMap';
import {useEASUpdateStatus} from 'hooks/useEASUpdateStatus';
import {HomeStackParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

export const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const updateAvailable = useEASUpdateStatus();

  // Alert.alert('Update Available', 'A new version of the app is available. Press OK to apply the update.', [
  //   {
  //     text: 'OK',
  //     onPress: () => void Updates.reloadAsync(),
  //   },
  // ]);
  const color = {
    idle: 'green',
    'checking-for-update': 'magenta',
    'update-available': 'blue',
    'downloading-update': 'yellow',
    'update-downloaded': 'red',
  }[updateAvailable];

  const {center_id, requestedTime} = route.params;
  return (
    <View style={{...styles.container, borderWidth: 4, borderColor: color}}>
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
