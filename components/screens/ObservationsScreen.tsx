import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {ObservationsStackParamList} from 'routes';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Observations} from 'components/Observations';
import {Observation} from 'components/Observation';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

const ObservationsStack = createNativeStackNavigator<ObservationsStackParamList>();
export interface ObservationsTabScreenProps {
  defaultCenterId: AvalancheCenterID;
  defaultDateString: string;
}
export const ObservationsTabScreen = ({defaultCenterId, defaultDateString}: ObservationsTabScreenProps) => {
  return (
    <ObservationsStack.Navigator initialRouteName="observations">
      <ObservationsStack.Screen
        name="observations"
        component={ObservationsScreen}
        initialParams={{center_id: defaultCenterId, dateString: defaultDateString}}
        options={({route: {params}}) => ({title: `${params.center_id} Observations`})}
      />
      <ObservationsStack.Screen name="observation" component={ObservationScreen} />
    </ObservationsStack.Navigator>
  );
};
const ObservationsScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observations'>) => {
  const {center_id, dateString} = route.params;
  return (
    <View style={styles.fullScreen}>
      <Observations center_id={center_id} date={new Date(dateString)} />
    </View>
  );
};
const ObservationScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <Observation id={id} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
