import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ForecastScreen} from './ForecastScreen';
import {MapScreen} from './MapScreen';
import {HomeStackParamList} from 'routes';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
export interface HomeTabScreenProps {
  defaultCenterId: AvalancheCenterID;
  defaultDateString: string;
}
export const HomeTabScreen = ({defaultCenterId, defaultDateString}: HomeTabScreenProps) => {
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter">
      <AvalancheCenterStack.Screen
        name="avalancheCenter"
        component={MapScreen}
        initialParams={{center_id: defaultCenterId, dateString: defaultDateString}}
        options={() => ({headerShown: false})}
      />
      <AvalancheCenterStack.Screen name="forecast" component={ForecastScreen} options={() => ({headerShown: false})} />
    </AvalancheCenterStack.Navigator>
  );
};
