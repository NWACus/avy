import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {NWACObservationDetailView, ObservationDetailView} from 'components/observations/ObservationDetailView';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {ObservationsPortal} from 'components/observations/ObservationsPortal';
import {SimpleForm} from 'components/observations/SimpleForm';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ObservationsStackParamList, TabNavigatorParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

const ObservationsStack = createNativeStackNavigator<ObservationsStackParamList>();
export const ObservationsTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <ObservationsStack.Navigator initialRouteName="observationsPortal">
      <ObservationsStack.Screen
        name="observationsPortal"
        component={ObservationsPortalScreen}
        initialParams={{center_id: center_id, requestedTime}}
        options={{headerShown: false}}
      />
      <ObservationsStack.Screen name="observationSubmit" component={ObservationSubmitScreen} options={{headerShown: false}} />
      <ObservationsStack.Screen name="observationsList" component={ObservationsListScreen} options={() => ({title: `${center_id} Observations`})} />
      <ObservationsStack.Screen name="observation" component={ObservationScreen} />
      <ObservationsStack.Screen name="nwacObservation" component={NWACObservationScreen} />
    </ObservationsStack.Navigator>
  );
};

const ObservationsPortalScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsPortal'>) => {
  const {center_id, requestedTime} = route.params;
  return <ObservationsPortal center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />;
};

const ObservationSubmitScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationSubmit'>) => {
  const {center_id} = route.params;
  return <SimpleForm center_id={center_id} />;
};

const ObservationsListScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsList'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <View style={styles.fullScreen}>
      <ObservationsListView center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />
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

const NWACObservationScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'nwacObservation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <NWACObservationDetailView id={id} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
