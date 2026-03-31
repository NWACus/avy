import {RouteProp} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {AvalancheCenters} from 'components/avalancheCenterList';
import {NavigationHeader} from 'components/content/NavigationHeader';
import {View} from 'components/core';
import {FeatureFlagsDebuggerScreen} from 'components/FeatureFlagsDebugger';
import {NWACObservationDetailView, ObservationDetailView} from 'components/observations/ObservationDetailView';
import {ObservationDetailModalView} from 'components/observations/ObservationDetailViewModal';
import {ObservationForm} from 'components/observations/ObservationForm';
import {ObservationsPortal} from 'components/observations/ObservationsPortal';
import {ForecastScreen} from 'components/screens/ForecastScreen';
import {AboutScreen} from 'components/screens/main/AboutScreen';
import {AvalancheCenterSelectorScreen} from 'components/screens/main/AvalancheCenterSelectorScreen';
import {
  AvalancheComponentPreview,
  ButtonStylePreview,
  DebugMapScreen,
  DeveloperMenuScreen,
  ExpoConfigScreen,
  OutcomeScreen,
  TextStylePreview,
  TimeMachine,
  ToastPreview,
} from 'components/screens/main/DeveloperMenu';
import {BottomTabs} from 'components/screens/navigation/BottomTabs';
import {WeatherStationDetail} from 'components/weather_data/WeatherStationDetail';
import {WeatherStationsDetail} from 'components/weather_data/WeatherStationsDetail';
import {usePreferences} from 'Preferences';
import React, {useCallback} from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BackButtonDisplayMode} from 'react-native-screens';
import {MainStackParamList} from 'routes';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {parseRequestedTimeString, RequestedTime} from 'utils/date';

const MainStack = createNativeStackNavigator<MainStackParamList>();
export const MainStackNavigator: React.FunctionComponent<{
  requestedTime: RequestedTime;
  centerId: AvalancheCenterID;
  staging: boolean;
  setStaging: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({requestedTime, centerId, staging, setStaging}) => {
  const {setPreferences} = usePreferences();

  const setAvalancheCenter = useCallback(
    (avalancheCenterId: AvalancheCenterID) => {
      setPreferences({center: avalancheCenterId});
    },
    [setPreferences],
  );

  const renderBottomTabs = useCallback((_: {route: RouteProp<MainStackParamList, 'bottomTabs'>}) => <BottomTabs requestedTime={requestedTime} />, [requestedTime]);

  const avalancheCenterSelectorOptions = useCallback(
    ({route}: {route: RouteProp<MainStackParamList, 'avalancheCenterSelector'>}) => ({
      headerShown: true,
      title: `Select Avalanche Center${route.params.debugMode ? ' (debug)' : ''}`,
      headerBackButtonDisplayMode: 'minimal' as BackButtonDisplayMode,
    }),
    [],
  );

  return (
    <MainStack.Navigator screenOptions={{header: props => <NavigationHeader {...props} />}} initialRouteName="bottomTabs">
      {/* Renders the bottom tab screens */}
      <MainStack.Screen name="bottomTabs" options={{headerShown: false}}>
        {renderBottomTabs}
      </MainStack.Screen>

      {/* We don't want to show the bottom tab on these views. As such they cannot be a part of the bottom tab navigator */}
      <MainStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: centerId, requestedTime: requestedTime.toString()}} />
      <MainStack.Screen name="stationsDetail" component={WeatherStationsDetailScreen} options={{title: 'Weather Station'}} />
      <MainStack.Screen name="stationDetail" component={WeatherStationDetailScreen} options={{title: 'Weather Station'}} />
      <MainStack.Screen
        name="observation"
        component={ObservationDetailScreen}
        options={{
          title: 'Observation',
        }}
      />

      <MainStack.Screen
        name="observationModal"
        component={ObservationDetailModal}
        options={{
          presentation: 'pageSheet',
          headerShown: false,
        }}
      />

      <MainStack.Screen
        name="nwacObservation"
        component={NWACObservationDetailScreen}
        options={{
          title: 'Observation',
        }}
      />
      <MainStack.Screen
        name="observationSubmit"
        component={ObservationSubmitScreen}
        options={{
          title: 'Submit an Observation',
        }}
      />
      <MainStack.Screen
        name="observationsPortal"
        component={ObservationsPortalScreen}
        options={{
          title: 'Observation Portal',
        }}
      />

      <MainStack.Screen
        name="avalancheCenterSelector"
        component={AvalancheCenterSelectorScreen(AvalancheCenters.SupportedCenters, centerId, setAvalancheCenter)}
        options={avalancheCenterSelectorOptions}
      />
      <MainStack.Screen name="about" component={AboutScreen} options={{title: 'Avy', headerBackButtonDisplayMode: 'minimal'}} />

      {/* Developer Menu Screens */}
      <MainStack.Screen
        name="developerMenu"
        component={DeveloperMenuScreen}
        initialParams={{staging: staging, setStaging: setStaging}}
        options={{title: 'Developer Menu', headerBackButtonDisplayMode: 'minimal'}}
      />

      <MainStack.Screen name="debugForecastMap" component={DebugMapScreen} options={{title: `Debug Forecast Map`, headerBackButtonDisplayMode: 'minimal'}} />

      <MainStack.Screen name="outcome" component={OutcomeScreen} options={{title: `Outcome Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <MainStack.Screen name="expoConfig" component={ExpoConfigScreen} options={{title: `Expo Configuration Viewer`, headerBackButtonDisplayMode: 'minimal'}} />
      <MainStack.Screen name="featureFlags" component={FeatureFlagsDebuggerScreen} options={{title: `Feature Flag Debugger`, headerBackButtonDisplayMode: 'minimal'}} />

      <MainStack.Screen name="buttonStylePreview" component={ButtonStylePreview} options={{title: `Button Style Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <MainStack.Screen name="textStylePreview" component={TextStylePreview} options={{title: `Text Style Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <MainStack.Screen
        name="avalancheComponentPreview"
        component={AvalancheComponentPreview}
        options={{title: `Avalanche Component Preview`, headerBackButtonDisplayMode: 'minimal'}}
      />
      <MainStack.Screen name="toastPreview" component={ToastPreview} options={{title: `Toast Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <MainStack.Screen name="timeMachine" component={TimeMachine} options={{title: `Time Machine`, headerBackButtonDisplayMode: 'minimal'}} />
    </MainStack.Navigator>
  );
};

// MARK: Observation Screens

const ObservationsPortalScreen = ({route}: NativeStackScreenProps<MainStackParamList, 'observationsPortal'>) => {
  const {requestedTime} = route.params;
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return <ObservationsPortal key={`${center_id}-observationsPortal`} center_id={center_id} requestedTime={parseRequestedTimeString(requestedTime)} />;
};

const ObservationSubmitScreen = () => {
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return <ObservationForm key={`${center_id}-observationForm`} center_id={center_id} />;
};

const ObservationDetailScreen = ({route}: NativeStackScreenProps<MainStackParamList, 'observation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <ObservationDetailView id={id} />
    </View>
  );
};

const ObservationDetailModal = ({route}: NativeStackScreenProps<MainStackParamList, 'observationModal'>) => {
  const {id} = route.params;

  return (
    <View style={styles.fullScreen}>
      <ObservationDetailModalView id={id} />
    </View>
  );
};

const NWACObservationDetailScreen = ({route}: NativeStackScreenProps<MainStackParamList, 'nwacObservation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.fullScreen}>
      <NWACObservationDetailView id={id} />
    </View>
  );
};

// MARK: Weather Station Screens

const WeatherStationsDetailScreen = ({route}: NativeStackScreenProps<MainStackParamList, 'stationsDetail'>) => {
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return (
    <View flex={1} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there, or top edge since StackHeader is sitting there */}
      <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
        <WeatherStationsDetail key={`${center_id}-weatherStationsDetailsPage`} {...route.params} />
      </SafeAreaView>
    </View>
  );
};

const WeatherStationDetailScreen = ({route}: NativeStackScreenProps<MainStackParamList, 'stationDetail'>) => {
  const {preferences} = usePreferences();
  const center_id = preferences.center;
  return (
    <View flex={1} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there, or top edge since StackHeader is sitting there */}
      <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
        <WeatherStationDetail key={`${center_id}-weatherStationDetailsPage`} {...route.params} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});
