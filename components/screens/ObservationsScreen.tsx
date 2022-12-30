import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {ObservationsStackParamList, TabNavigatorParamList} from 'routes';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Observations} from 'components/Observations';
import {Observation} from 'components/Observation';

const ObservationsStack = createNativeStackNavigator<ObservationsStackParamList>();
export const ObservationsTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {center_id, date} = route.params;
  return (
    <ObservationsStack.Navigator initialRouteName="observations">
      <ObservationsStack.Screen
        name="observations"
        component={ObservationsScreen}
        initialParams={{center_id: center_id, date: date}}
        options={() => ({title: `${center_id} Observations`})}
      />
      <ObservationsStack.Screen name="observation" component={ObservationScreen} />
    </ObservationsStack.Navigator>
  );
};
const ObservationsScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observations'>) => {
  const {center_id, date} = route.params;
  return (
    <View style={styles.fullScreen}>
      <Observations center_id={center_id} date={date} />
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
