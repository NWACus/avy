import {StyleSheet, View} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AvalancheForecastZoneMap} from 'components/AvalancheForecastZoneMap';
import {HomeStackParamList} from 'routes';

export const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const {center_id, date} = route.params;
  return (
    <View style={{...styles.container}}>
      <AvalancheForecastZoneMap centers={[center_id]} date={date} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
