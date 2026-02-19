import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavigationHeader} from 'components/content/NavigationHeader';
import {NWACObservationDetailView, ObservationDetailView} from 'components/observations/ObservationDetailView';
import {ObservationForm} from 'components/observations/ObservationForm';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {ObservationsPortal} from 'components/observations/ObservationsPortal';
import {usePreferences} from 'Preferences';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ObservationsStackParamList, TabNavigatorParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

const ObservationsStack = createNativeStackNavigator<ObservationsStackParamList>();
export const ObservationsTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {requestedTime} = route.params;
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return (
    <ObservationsStack.Navigator
      initialRouteName="observationsList"
      screenOptions={{
        header: props => <NavigationHeader center_id={center_id} {...props} />,
      }}>
      <ObservationsStack.Screen name="observationsPortal" component={ObservationsPortalScreen} initialParams={{requestedTime}} options={{headerShown: false}} />
      <ObservationsStack.Screen name="observationSubmit" component={ObservationSubmitScreen} options={{title: 'Submit an Observation'}} />
      <ObservationsStack.Screen name="observationsList" component={ObservationsListScreen} options={{title: 'Observations'}} initialParams={{requestedTime}} />
      <ObservationsStack.Screen name="observation" component={ObservationScreen} options={{title: 'Observation'}} />
      <ObservationsStack.Screen name="nwacObservation" component={NWACObservationScreen} options={{title: 'Observation'}} />
    </ObservationsStack.Navigator>
  );
};

const ObservationsPortalScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsPortal'>) => {
  const {requestedTime} = route.params;
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return <ObservationsPortal key={`${center_id}-observationsPortal`} center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />;
};

export const ObservationSubmitScreen = () => {
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return <ObservationForm key={`${center_id}-observationForm`} center_id={center_id} />;
};

const ObservationsListScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsList'>) => {
  const {requestedTime} = route.params;
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return (
    <View style={{...styles.fullScreen, backgroundColor: 'white'}}>
      <ObservationsListView key={`${center_id}-observationsList`} center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />
    </View>
  );
};

export const ObservationScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <ObservationDetailView id={id} />
    </View>
  );
};

export const NWACObservationScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'nwacObservation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <NWACObservationDetailView id={id} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});
