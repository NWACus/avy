import React, {useEffect, useState} from 'react';

import {AppStateStatus, DevSettings, Platform, StyleSheet, Text} from 'react-native';
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
// import {TelemetryStationMap} from './components/TelemetryStationMap';
// import {TelemetryStationData} from './components/TelemetryStationData';
import {TabNavigatorParamList, HomeStackParamList} from './routes';

Sentry.init({
  // we're overwriting a field that was previously defined in app.json, so we know it's non-null:
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  dsn: Constants.expoConfig.extra!.sentry_dsn,
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

const queryClient: QueryClient = new QueryClient();

const Tab = createBottomTabNavigator<TabNavigatorParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

// TODO(brian): do we need this? I'm guessing this kept things working while
// developing in the offseason. Also TBD whether this should be part of the
// route; are there use cases for supporting forecasts from different dates than
// "today"?
const defaultDate = formatISO(new Date('2022-03-01'));

// TODO(brian): commented out stuff needs to be moved/restored, keeping it here for now

type AvalancheCenterProps = NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>;
// const AvalancheCenterTab = createBottomTabNavigator<HomeStackParamList>();
// const AvalancheCenterTabScreen = ({route}: AvalancheCenterProps) => {
//   const {center_id, date} = route.params;
//   return (
//     <AvalancheCenterTab.Navigator screenOptions={{headerShown: false}}>
//       <AvalancheCenterTab.Screen
//         name={'avalancheCenterStack'}
//         component={AvalancheCenterStackScreen}
//         initialParams={{center_id: center_id, date: date}}
//         options={() => ({title: center_id})}
//       />
//       <AvalancheCenterTab.Screen
//         name={'avalancheCenterTelemetryStack'}
//         component={AvalancheCenterTelemetryStackScreen}
//         initialParams={{center_id: center_id}}
//         options={({route}) => ({title: `${route.params.center_id} Telemetry Stations`})}
//       />
//     </AvalancheCenterTab.Navigator>
//   );
// };

// const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
// const AvalancheCenterStackScreen = ({route}: AvalancheCenterProps) => {
//   const {center_id, date} = route.params;
//   return (
//     <AvalancheCenterStack.Navigator initialRouteName="avalancheCenter">
//       <AvalancheCenterStack.Screen
//         name="avalancheCenter"
//         component={MapScreen}
//         initialParams={{center_id: center_id, date: date}}
//         options={({route}) => ({title: route.params.center_id})}
//       />
//       <AvalancheCenterStack.Screen
//         name="forecast"
//         component={ForecastScreen}
//         initialParams={{center_id: center_id, date: date}}
//         options={({route}) => ({title: String(route.params.forecast_zone_id)})}
//       />
//     </AvalancheCenterStack.Navigator>
//   );
// };

const MapScreen = ({route}: AvalancheCenterProps) => {
  const {center_id, date} = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <AvalancheForecastZoneMap centers={[center_id]} date={date} />
    </SafeAreaView>
  );
};

type ForecastScreenProps = NativeStackScreenProps<HomeStackParamList, 'forecast'>;
const ForecastScreen = ({route}: ForecastScreenProps) => {
  const {center_id, forecast_zone_id, date} = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <AvalancheForecast center_id={center_id} forecast_zone_id={forecast_zone_id} date={date} />
    </SafeAreaView>
  );
};

// const AvalancheCenterTelemetryStack = createNativeStackNavigator<HomeStackParamList>();
// const AvalancheCenterTelemetryStackScreen = ({route}: AvalancheCenterProps) => {
//   const {center_id} = route.params;
//   return (
//     <AvalancheCenterTelemetryStack.Navigator initialRouteName="telemetryStations">
//       <AvalancheCenterTelemetryStack.Screen
//         name="telemetryStations"
//         component={TelemetryScreen}
//         initialParams={{center_id: center_id}}
//         options={({route}) => ({title: `${route.params.center_id} Telemetry Stations`})}
//       />
//       <AvalancheCenterTelemetryStack.Screen
//         name="telemetryStation"
//         component={TelemetryStationScreen}
//         initialParams={{center_id: center_id}}
//         options={({route}) => ({title: String(route.params.name)})}
//       />
//     </AvalancheCenterTelemetryStack.Navigator>
//   );
// };

// const TelemetryScreen = ({route}: AvalancheCenterProps) => {
//   const {center_id} = route.params;
//   return (
//     <SafeAreaView style={styles.container}>
//       <TelemetryStationMap center_id={center_id} />
//     </SafeAreaView>
//   );
// };

// type TelemetryStationProps = NativeStackScreenProps<HomeStackParamList, 'telemetryStation'>;
// const TelemetryStationScreen = ({route}: TelemetryStationProps) => {
//   const {center_id, source, station_id} = route.params;
//   return (
//     <SafeAreaView style={styles.container}>
//       <TelemetryStationData center_id={center_id} source={source} station_id={station_id} />
//     </SafeAreaView>
//   );
// };

const onAppStateChange = (status: AppStateStatus) => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

function PlaceholderScreen(label: string) {
  return (
    <SafeAreaView style={styles.container}>
      <Text>{label}</Text>
    </SafeAreaView>
  );
}

function HomeScreen({route}) {
  const {center_id} = route.params;
  return (
    <HomeStack.Navigator initialRouteName="avalancheCenter">
      <HomeStack.Screen
        name="avalancheCenter"
        component={MapScreen}
        initialParams={{center_id: center_id, date: defaultDate}}
        options={({route}) => ({title: route.params.center_id, headerBarStatusHeight: 0})}
      />
      <HomeStack.Screen
        name="forecast"
        component={ForecastScreen}
        initialParams={{center_id: center_id, date: defaultDate}}
        options={({route}) => ({title: String(route.params.forecast_zone_id)})}
      />
    </HomeStack.Navigator>
  );
}

// TODO(brian): move this into app config
export const defaultCenterId = 'NWAC';

const App = () => {
  try {
    // your code
    useOnlineManager();

    useAppState(onAppStateChange);

    const locationStatus = useLocation(_location => {
      // console.log('Location update', location);
      undefined;
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
              <Tab.Navigator initialRouteName="Home" screenOptions={{headerBarStatusHeight: 0}}>
                <Tab.Screen name="Home" initialParams={{center_id: defaultCenterId}}>
                  {args => HomeScreen(args)}
                </Tab.Screen>
                <Tab.Screen name="Observations" initialParams={{center_id: defaultCenterId}}>
                  {() => PlaceholderScreen('Observations')}
                </Tab.Screen>
                <Tab.Screen name="WeatherData" initialParams={{center_id: defaultCenterId}}>
                  {() => PlaceholderScreen('Weather data')}
                </Tab.Screen>
                <Tab.Screen name="Menu" initialParams={{center_id: defaultCenterId}}>
                  {() => PlaceholderScreen('Menu')}
                </Tab.Screen>
                {__DEV__ && (
                  <Tab.Screen name="Debug" initialParams={{center_id: defaultCenterId}}>
                    {() => (
                      <SafeAreaView style={styles.container}>
                        <AvalancheCenterSelector />
                      </SafeAreaView>
                    )}
                  </Tab.Screen>
                )}
              </Tab.Navigator>
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
