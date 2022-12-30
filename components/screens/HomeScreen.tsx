import {NativeStackScreenProps, createNativeStackNavigator} from '@react-navigation/native-stack';

import {ForecastScreen} from './ForecastScreen';
import {MapScreen} from './MapScreen';
import {TabNavigatorParamList, HomeStackParamList} from 'routes';

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
export const HomeTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Home'>) => {
  const {center_id, date} = route.params;
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter">
      <AvalancheCenterStack.Screen name="avalancheCenter" component={MapScreen} initialParams={{center_id: center_id, date: date}} options={() => ({headerShown: false})} />
      <AvalancheCenterStack.Screen
        name="forecast"
        component={ForecastScreen}
        initialParams={{center_id: center_id, date: date}}
        options={({route}) => ({title: String(route.params.zoneName)})}
      />
    </AvalancheCenterStack.Navigator>
  );
};
