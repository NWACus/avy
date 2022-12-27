import {StyleSheet, View} from 'react-native';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from 'routes';

import {AvalancheForecastZoneMap} from 'components/AvalancheForecastZoneMap';
import {AvalancheForecast} from 'components/AvalancheForecast';

const HomeScreenMapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const {center_id, date} = route.params;
  return (
    <View style={{...styles.container}}>
      <AvalancheForecastZoneMap centers={[center_id]} date={date} />
    </View>
  );
};

type HomeScreenForecastScreenProps = NativeStackScreenProps<HomeStackParamList, 'forecast'>;
const HomeScreenForecastScreen = ({route}: HomeScreenForecastScreenProps) => {
  const {center_id, forecast_zone_id, date} = route.params;
  return (
    <View style={styles.container}>
      <AvalancheForecast center_id={center_id} forecast_zone_id={forecast_zone_id} date={date} />
    </View>
  );
};

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
export const AvalancheCenterStackScreen = (center_id: string, date: string) => {
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter">
      <AvalancheCenterStack.Screen
        name="avalancheCenter"
        component={HomeScreenMapScreen}
        initialParams={{center_id: center_id, date: date}}
        options={({route}) => ({title: route.params.center_id})}
      />
      <AvalancheCenterStack.Screen
        name="forecast"
        component={HomeScreenForecastScreen}
        initialParams={{center_id: center_id, date: date}}
        options={({route}) => ({title: String(route.params.forecast_zone_id)})}
      />
    </AvalancheCenterStack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
