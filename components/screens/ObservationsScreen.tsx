import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {ObservationsStackParamList, TabNavigatorParamList} from 'routes';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {ObservationDetailView} from 'components/observations/ObservationDetailView';
import {Center} from 'components/core';
import {Body} from 'components/text';
import {ObservationsPortal} from 'components/observations/ObservationsPortal';

const ObservationsStack = createNativeStackNavigator<ObservationsStackParamList>();
export const ObservationsTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {center_id, dateString} = route.params;
  return (
    <ObservationsStack.Navigator initialRouteName="observationsPortal">
      <ObservationsStack.Screen name="observationsPortal" component={ObservationsPortalScreen} initialParams={{center_id: center_id, dateString}} options={{headerShown: false}} />
      <ObservationsStack.Screen name="observationSubmit" component={ObservationSubmitScreen} />
      <ObservationsStack.Screen name="observationsList" component={ObservationsListScreen} options={() => ({title: `${center_id} Observations`})} />
      <ObservationsStack.Screen name="observation" component={ObservationScreen} />
    </ObservationsStack.Navigator>
  );
};

const ObservationsPortalScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsPortal'>) => {
  const {center_id, dateString} = route.params;
  return <ObservationsPortal center_id={center_id} date={new Date(dateString)} />;
};

const ObservationSubmitScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationSubmit'>) => {
  const {center_id} = route.params;
  return (
    <View style={{...styles.fullScreen}}>
      <Center width="100%" height="100%">
        <Body>stay tuned for observation submission {center_id}</Body>
      </Center>
    </View>
  );
};

const ObservationsListScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsList'>) => {
  const {center_id, dateString} = route.params;
  return (
    <View style={styles.fullScreen}>
      <ObservationsListView center_id={center_id} date={new Date(dateString)} />
    </View>
  );
};

const ObservationScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <ObservationDetailView id={id} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
