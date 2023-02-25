import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {ForecastScreen} from 'components/screens/ForecastScreen';
import {MapScreen} from 'components/screens/MapScreen';
import {StationDetailScreen} from 'components/screens/WeatherScreen';
import {HomeStackParamList, TabNavigatorParamList} from 'routes';

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
export const HomeTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Home'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter" screenOptions={{headerShown: false}}>
      <AvalancheCenterStack.Screen name="avalancheCenter" component={MapScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} />
      <AvalancheCenterStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} />
      <AvalancheCenterStack.Screen name="stationDetail" component={StationDetailScreen} />
    </AvalancheCenterStack.Navigator>
  );
};
