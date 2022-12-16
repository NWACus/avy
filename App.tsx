import React, {useEffect, useState} from 'react';

import {AppStateStatus, DevSettings, Platform, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo';

import {formatISO} from 'date-fns';
import {focusManager, QueryClient, QueryClientProvider} from 'react-query';

import {ClientContext, productionClientProps, stagingClientProps} from './clientContext';
import {AvalancheForecastZoneMap} from './components/AvalancheForecastZoneMap';
import {AvalancheForecast} from './components/AvalancheForecast';
import {AvalancheCenterSelector} from './components/AvalancheCenterSelector';
import {useAppState} from './hooks/useAppState';
import {useLocation} from './hooks/useLocation';
import {useOnlineManager} from './hooks/useOnlineManager';
import {TelemetryStationMap} from './components/TelemetryStationMap';
import {TelemetryStationData} from './components/TelemetryStationData';

Sentry.init({
  // we're overwriting a field that was previously defined in app.json, so we know it's non-null:
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  dsn: Constants.expoConfig.extra!.sentry_dsn,
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

const queryClient: QueryClient = new QueryClient();

const AvalancheCenterSelectorScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <AvalancheCenterSelector date={formatISO(new Date('2022-03-01'))} />
    </SafeAreaView>
  );
};

const SelectorStack = createNativeStackNavigator<StackParamList>();
const AvalancheCenterSelectionScreen = () => {
  // TODO(skuznets) not showing the header here means iOS has no way to get back to this screen once they choose a center, but showing it means we double-up on headers ... ?
  return (
    <SelectorStack.Navigator initialRouteName="avalancheCenterSelection" screenOptions={{headerStatusBarHeight: 0}}>
      <SelectorStack.Screen name="avalancheCenterSelection" component={AvalancheCenterSelectorScreen} options={{title: 'Select an Avalanche Center'}} />
      <SelectorStack.Screen name="avalancheCenterHome" component={AvalancheCenterTabScreen} options={({route}) => ({title: route.params.center_id})} />
    </SelectorStack.Navigator>
  );
};

type AvalancheCenterProps = NativeStackScreenProps<StackParamList, 'avalancheCenter'>;
const AvalancheCenterTab = createBottomTabNavigator<StackParamList>();
const AvalancheCenterTabScreen = ({route}: AvalancheCenterProps) => {
  const {center_id, date} = route.params;
  return (
    <AvalancheCenterTab.Navigator screenOptions={{headerShown: false}}>
      <AvalancheCenterTab.Screen
        name={'avalancheCenterStack'}
        component={AvalancheCenterStackScreen}
        initialParams={{center_id: center_id, date: date}}
        options={() => ({title: center_id})}
      />
      <AvalancheCenterTab.Screen
        name={'avalancheCenterTelemetryStack'}
        component={AvalancheCenterTelemetryStackScreen}
        initialParams={{center_id: center_id}}
        options={({route}) => ({title: `${route.params.center_id} Telemetry Stations`})}
      />
    </AvalancheCenterTab.Navigator>
  );
};

const AvalancheCenterStack = createNativeStackNavigator<StackParamList>();
const AvalancheCenterStackScreen = ({route}: AvalancheCenterProps) => {
  const {center_id, date} = route.params;
  return (
    <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter">
      <AvalancheCenterStack.Screen
        name="avalancheCenter"
        component={MapScreen}
        initialParams={{center_id: center_id, date: date}}
        options={({route}) => ({title: route.params.center_id})}
      />
      <AvalancheCenterStack.Screen
        name="forecast"
        component={ForecastScreen}
        initialParams={{center_id: center_id, date: date}}
        options={({route}) => ({title: String(route.params.forecast_zone_id)})}
      />
    </AvalancheCenterStack.Navigator>
  );
};

const MapScreen = ({route}: AvalancheCenterProps) => {
  const {center_id, date} = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <AvalancheForecastZoneMap centers={[center_id]} date={date} />
    </SafeAreaView>
  );
};

type ForecastScreenProps = NativeStackScreenProps<StackParamList, 'forecast'>;
const ForecastScreen = ({route}: ForecastScreenProps) => {
  const {center_id, forecast_zone_id, date} = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <AvalancheForecast center_id={center_id} forecast_zone_id={forecast_zone_id} date={date} />
    </SafeAreaView>
  );
};

const AvalancheCenterTelemetryStack = createNativeStackNavigator<StackParamList>();
const AvalancheCenterTelemetryStackScreen = ({route}: AvalancheCenterProps) => {
  const {center_id} = route.params;
  return (
    <AvalancheCenterTelemetryStack.Navigator initialRouteName="telemetryStations">
      <AvalancheCenterTelemetryStack.Screen
        name="telemetryStations"
        component={TelemetryScreen}
        initialParams={{center_id: center_id}}
        options={({route}) => ({title: `${route.params.center_id} Telemetry Stations`})}
      />
      <AvalancheCenterTelemetryStack.Screen
        name="telemetryStation"
        component={TelemetryStationScreen}
        initialParams={{center_id: center_id}}
        options={({route}) => ({title: String(route.params.name)})}
      />
    </AvalancheCenterTelemetryStack.Navigator>
  );
};

const TelemetryScreen = ({route}: AvalancheCenterProps) => {
  const {center_id} = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <TelemetryStationMap center_id={center_id} />
    </SafeAreaView>
  );
};

type TelemetryStationProps = NativeStackScreenProps<StackParamList, 'telemetryStation'>;
const TelemetryStationScreen = ({route}: TelemetryStationProps) => {
  const {center_id, source, station_id} = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <TelemetryStationData center_id={center_id} source={source} station_id={station_id} />
    </SafeAreaView>
  );
};

type StackParamList = {
  avalancheCenterSelection: undefined;
  avalancheCenterHome: {
    center_id: string;
    date: string;
  };
  avalancheCenterStack: {
    center_id: string;
    date: string;
  };
  avalancheCenter: {
    center_id: string;
    date: string;
  };
  forecast: {
    center_id: string;
    forecast_zone_id: number;
    date: string;
  };
  avalancheCenterTelemetryStack: {
    center_id: string;
  };
  telemetryStations: {
    center_id: string;
  };
  telemetryStation: {
    center_id: string;
    source: string;
    station_id: number;
    name: string;
  };
};

// TODO(brian): dig into this. This is somehow suppressing typescript errors in
// other files - if you comment it out, compilation fails.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends StackParamList {}
  }
}

const onAppStateChange = (status: AppStateStatus) => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

const App = () => {
  try {
    // your code
    useOnlineManager();

    useAppState(onAppStateChange);

    const locationStatus = useLocation(location => {
      console.log('Location update', location);
    });
    console.log('Location permission status', locationStatus);

    // Using NAC staging may trigger errors, but we'll try it for now
    const [contextValue, setContextValue] = useState(stagingClientProps);

    useEffect(() => {
      // Add toggle commands to the React Native debug menu
      // NB: the menu is only available in dev builds, *not* in Expo Go
      DevSettings.addMenuItem('Switch to staging API', () => {
        console.log('switch to staging API');
        setContextValue(stagingClientProps);
      });
      DevSettings.addMenuItem('Switch to production API', () => {
        console.log('Switch to production API');
        setContextValue(productionClientProps);
      });
    }, []); // this effect should only run once

    return (
      <ClientContext.Provider value={contextValue}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <NavigationContainer>
              <AvalancheCenterSelectionScreen />
            </NavigationContainer>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ClientContext.Provider>
    );
  } catch (error) {
    Sentry.Native.captureException(error);
    throw error;
  }
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});

export default App;
