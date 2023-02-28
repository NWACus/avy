import {AntDesign} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {HStack} from 'components/core';
import {NWACObservationDetailView, ObservationDetailView} from 'components/observations/ObservationDetailView';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {ObservationsPortal} from 'components/observations/ObservationsPortal';
import {SimpleForm} from 'components/observations/SimpleForm';
import {Title3Black} from 'components/text';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ObservationsStackNavigationProps, ObservationsStackParamList, TabNavigatorParamList} from 'routes';
import {colorLookup} from 'theme';
import {parseRequestedTimeString} from 'utils/date';

const ObservationsStack = createNativeStackNavigator<ObservationsStackParamList>();
export const ObservationsTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <ObservationsStack.Navigator initialRouteName="observationsPortal" screenOptions={{headerShown: false}}>
      <ObservationsStack.Screen name="observationsPortal" component={ObservationsPortalScreen} initialParams={{center_id: center_id, requestedTime}} />
      <ObservationsStack.Screen name="observationSubmit" component={ObservationSubmitScreen} />
      <ObservationsStack.Screen name="observationsList" component={ObservationsListScreen} />
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
  const navigation = useNavigation<ObservationsStackNavigationProps>();

  const ListHeader = () => (
    <HStack justifyContent="flex-start" pb={8} bg="white">
      <AntDesign.Button
        size={24}
        color={colorLookup('text')}
        name="arrowleft"
        backgroundColor="white"
        iconStyle={{marginLeft: 0, marginRight: 8}}
        style={{textAlign: 'center'}}
        onPress={() => navigation.goBack()}
      />
      <Title3Black>Observations</Title3Black>
    </HStack>
  );
  return (
    <View style={{...styles.fullScreen, backgroundColor: 'white'}}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
        <ObservationsListView center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} ListHeaderComponent={ListHeader} />
      </SafeAreaView>
    </View>
  );
};

export const ObservationScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observation'>) => {
  const {id} = route.params;
  console.log('navigating to NAC observation', id);
  return (
    <View style={styles.fullScreen}>
      <ObservationDetailView id={id} />
    </View>
  );
};

export const NWACObservationScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'nwacObservation'>) => {
  const {id} = route.params;
  console.log('navigating to NWAC observation', id);
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
