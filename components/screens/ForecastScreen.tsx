import {StyleSheet, View} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {AvalancheForecast} from 'components/AvalancheForecast';
import {HomeStackParamList} from 'routes';

export const ForecastScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'forecast'>) => {
  const {center_id, forecast_zone_id, date} = route.params;
  return (
    <View style={styles.container}>
      <AvalancheForecast center_id={center_id} forecast_zone_id={forecast_zone_id} date={date} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
