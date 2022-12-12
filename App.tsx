import React, {Context} from 'react';

import {AppStateStatus, Platform, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo';

import {formatISO} from 'date-fns';
import {focusManager, QueryClient, QueryClientProvider} from 'react-query';

import {ClientContext, defaultClientProps} from './clientContext';
import {AvalancheForecastZoneMap} from './components/AvalancheForecastZoneMap';
import {AvalancheForecast} from './components/AvalancheForecast';
import {AvalancheCenterSelector} from './components/AvalancheCenterSelector';
import {useOnlineManager} from './hooks/useOnlineManager';
import {useAppState} from './hooks/useAppState';
import {TelemetryStationMap} from './components/TelemetryStationMap';
import {TelemetryStationData} from './components/TelemetryStationData';

Sentry.init({
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
    <SelectorStack.Navigator initialRouteName="avalancheCenterSelection" screenOptions={{headerShown: false}}>
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
        options={({route}) => ({title: center_id})}
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

const Stack = createNativeStackNavigator<StackParamList>();

declare global {
  namespace ReactNavigation {
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

    return (
      <ClientContext.Provider value={defaultClientProps}>
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
  }
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});

export default App;
