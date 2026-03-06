import {RouteProp} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {usePreferences} from 'Preferences';
import {FeatureFlagsDebuggerScreen} from 'components/FeatureFlagsDebugger';
import {AvalancheCenters} from 'components/avalancheCenterList';
import {ForecastScreen} from 'components/screens/ForecastScreen';
import {DrawerNavigator} from 'components/screens/navigation/Drawer';
import {NWACObservationDetailScreen, ObservationDetailScreen} from 'components/screens/navigation/MainStack';
import {AboutScreen} from 'components/screens/root/AboutScreen';
import {AvalancheCenterSelectorScreen} from 'components/screens/root/AvalancheCenterSelectorScreen';
import {AvalancheComponentPreview, ButtonStylePreview, ExpoConfigScreen, OutcomeScreen, TextStylePreview, TimeMachine, ToastPreview} from 'components/screens/root/DeveloperMenu';
import React, {useCallback} from 'react';
import {BackButtonDisplayMode} from 'react-native-screens';
import {RootStackParamList} from 'routes';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';

const RootStack = createNativeStackNavigator<RootStackParamList>();
export const RootStackNavigator: React.FunctionComponent<{
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

  const renderDrawerNavigator = useCallback(
    (_: {route: RouteProp<RootStackParamList, 'drawer'>}) => <DrawerNavigator requestedTime={requestedTime} centerId={centerId} staging={staging} setStaging={setStaging} />,
    [requestedTime, centerId, staging, setStaging],
  );

  const avalancheCenterSelectorOptions = useCallback(
    (_: {route: RouteProp<RootStackParamList, 'avalancheCenterSelector'>}) => ({
      headerShown: true,
      title: `Select Avalanche Center`,
      headerBackButtonDisplayMode: 'minimal' as BackButtonDisplayMode,
    }),
    [],
  );

  return (
    <RootStack.Navigator initialRouteName="drawer">
      <RootStack.Screen name="drawer" options={{headerShown: false}}>
        {renderDrawerNavigator}
      </RootStack.Screen>
      <RootStack.Screen
        name="avalancheCenterSelector"
        component={AvalancheCenterSelectorScreen(AvalancheCenters.SupportedCenters, centerId, setAvalancheCenter)}
        options={avalancheCenterSelectorOptions}
      />
      <RootStack.Screen name="buttonStylePreview" component={ButtonStylePreview} options={{title: `Button Style Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen name="textStylePreview" component={TextStylePreview} options={{title: `Text Style Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen
        name="avalancheComponentPreview"
        component={AvalancheComponentPreview}
        options={{title: `Avalanche Component Preview`, headerBackButtonDisplayMode: 'minimal'}}
      />
      <RootStack.Screen name="toastPreview" component={ToastPreview} options={{title: `Toast Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen name="timeMachine" component={TimeMachine} options={{title: `Time Machine`, headerBackButtonDisplayMode: 'minimal'}} />
      {/* 
      This screen needs to be refactored to support showing the view outside of the bottom tabs
      <RootStack.Screen
        name="avalancheCenter"
        component={MapScreen}
        initialParams={{center_id: centerId, requestedTime: requestedTime.toString()}}
        options={{headerShown: false}}
      /> */}
      <RootStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: centerId, requestedTime: requestedTime.toString()}} options={{headerShown: false}} />
      <RootStack.Screen name="observation" component={ObservationDetailScreen} options={{headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen name="nwacObservation" component={NWACObservationDetailScreen} options={{headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen name="about" component={AboutScreen} options={{title: 'Avy', headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen name="outcome" component={OutcomeScreen} options={{title: `Outcome Preview`, headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen name="expoConfig" component={ExpoConfigScreen} options={{title: `Expo Configuration Viewer`, headerBackButtonDisplayMode: 'minimal'}} />
      <RootStack.Screen name="featureFlags" component={FeatureFlagsDebuggerScreen} options={{title: `Feature Flag Debugger`, headerBackButtonDisplayMode: 'minimal'}} />
    </RootStack.Navigator>
  );
};
