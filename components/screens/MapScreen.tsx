import React, {useEffect} from 'react';
import {Alert, View} from 'react-native';

import * as Updates from 'expo-updates';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useIsFocused} from '@react-navigation/native';
import {AvalancheForecastZoneMap} from 'components/AvalancheForecastZoneMap';
import {useEASUpdateStatus} from 'hooks/useEASUpdateStatus';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HomeStackParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

export const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const updateStatus = useEASUpdateStatus();
  const isActiveScreen = useIsFocused();
  const safeAreaInset = useSafeAreaInsets();

  useEffect(() => {
    if (updateStatus === 'update-downloaded' && isActiveScreen) {
      Alert.alert('Update Available', 'A new version of the app is available. Press OK to apply the update.', [
        {
          text: 'OK',
          onPress: () => void Updates.reloadAsync(),
        },
      ]);
    }
  }, [isActiveScreen, updateStatus]);

  const {requestedTime} = route.params;
  return (
    <View style={{flex: 1, paddingTop: safeAreaInset.top}}>
      <AvalancheForecastZoneMap requestedTime={parseRequestedTimeString(requestedTime)} />
    </View>
  );
};
