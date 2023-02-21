import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {ForecastScreen} from 'components/screens/ForecastScreen';
import {MapScreen} from 'components/screens/MapScreen';
import {HomeStackParamList, TabNavigatorParamList} from 'routes';

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
export const HomeTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Home'>) => {
  const {center_id, dateString} = route.params;
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter">
      <AvalancheCenterStack.Screen
        name="avalancheCenter"
        component={MapScreen}
        initialParams={{center_id: center_id, dateString: dateString}}
        options={() => ({headerShown: false})}
      />
      <AvalancheCenterStack.Screen
        name="forecast"
        component={ForecastScreen}
        initialParams={{center_id: center_id, dateString: dateString}}
        options={() => ({headerShown: false})}
      />
    </AvalancheCenterStack.Navigator>
  );
};
