import {StackNavigationState} from '@react-navigation/native';
import {NativeStackScreenProps, createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationHeader} from 'components/content/NavigationHeader';
import {NWACObservationDetailView, ObservationDetailView} from 'components/observations/ObservationDetailView';
import {ObservationImageEditView} from 'components/observations/ObservationImageEditView';
import {ObservationsListView} from 'components/observations/ObservationsListView';
import {ObservationsPortal} from 'components/observations/ObservationsPortal';
import {SimpleForm} from 'components/observations/SimpleForm';
import React, {useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import {ObservationsStackParamList, TabNavigatorParamList} from 'routes';
import {parseRequestedTimeString} from 'utils/date';

const ObservationsStack = createNativeStackNavigator<ObservationsStackParamList>();
export const ObservationsTabScreen = ({route}: NativeStackScreenProps<TabNavigatorParamList, 'Observations'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <ObservationsStack.Navigator
      initialRouteName="observationsList"
      screenOptions={{
        header: props => <NavigationHeader center_id={center_id} {...props} />,
        orientation: 'portrait',
      }}>
      <ObservationsStack.Screen name="observationsPortal" component={ObservationsPortalScreen} initialParams={{center_id, requestedTime}} options={{headerShown: false}} />
      <ObservationsStack.Screen name="observationSubmit" component={ObservationSubmitScreen} options={{title: 'Submit an Observation'}} />
      <ObservationsStack.Screen name="observationsList" component={ObservationsListScreen} options={{title: 'Observations'}} initialParams={{center_id, requestedTime}} />
      <ObservationsStack.Screen name="observation" component={ObservationScreen} options={{title: 'Observation'}} />
      <ObservationsStack.Screen name="nwacObservation" component={NWACObservationScreen} options={{title: 'Observation'}} />

      <ObservationsStack.Screen
        name="observationEditImage"
        component={ObservationImageEditScreen}
        options={{
          headerShown: false,
          title: 'Photo description',
          presentation: 'transparentModal',
          statusBarHidden: true,
          animation: 'fade',
          orientation: 'portrait',
        }}
      />
    </ObservationsStack.Navigator>
  );
};

type ObservationScreenNames = keyof ObservationsStackParamList;
type ObservationStackProps<T extends ObservationScreenNames> = NativeStackScreenProps<ObservationsStackParamList, T>;

const ObservationsPortalScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsPortal'>) => {
  const {center_id, requestedTime} = route.params;
  return <ObservationsPortal center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />;
};

const ObservationSubmitScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationSubmit'>) => {
  const {center_id, set_image_caption} = route.params;
  return <SimpleForm center_id={center_id} setImageCaption={set_image_caption} />;
};

const ObservationsListScreen = ({route}: NativeStackScreenProps<ObservationsStackParamList, 'observationsList'>) => {
  const {center_id, requestedTime} = route.params;
  return (
    <View style={{...styles.fullScreen, backgroundColor: 'white'}}>
      <ObservationsListView center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />
    </View>
  );
};

/**
 * Return the previous screen from the route stack.
 */
const lastScreen = (state: StackNavigationState<ObservationsStackParamList>) => state.routes[state.index - 1];

const ObservationImageEditScreen = ({route, navigation}: ObservationStackProps<'observationEditImage'>) => {
  const {image, caption} = route.params;

  const returnToScreen = lastScreen(navigation.getState());

  const onDismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSetCaption = useCallback(
    (caption: string) => {
      switch (returnToScreen.name) {
        case 'observationSubmit': {
          // Ideally the entire route would refine types based os the returnToScreen.name refinement
          // however that doesn't seem to be the case when using the getState() records.
          //
          // We are trusting that the routes are all contain the correct params and refining based
          // on the name
          const submitRoute = returnToScreen as ObservationStackProps<'observationSubmit'>['route'];
          navigation.navigate(submitRoute.name, {
            ...submitRoute.params,
            set_image_caption: [image, caption],
          });
          break;
        }
        default: {
          // noop
        }
      }
    },
    [navigation, image, returnToScreen],
  );
  return <ObservationImageEditView onSetCaption={handleSetCaption} initialCaption={caption} onDismiss={onDismiss} />;
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
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
