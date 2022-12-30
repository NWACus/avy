import React from 'react';

import {AppStateStatus, Platform, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AntDesign} from '@expo/vector-icons';

import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo';

import {formatISO} from 'date-fns';
import {focusManager, QueryClient, QueryClientProvider} from 'react-query';

import {NativeBaseProvider, extendTheme} from 'native-base';

import {ClientContext, productionHosts, stagingHosts} from 'clientContext';
import {defaults} from 'defaults';
import {useAppState} from 'hooks/useAppState';
import {useOnlineManager} from 'hooks/useOnlineManager';
import {TelemetryStationMap} from 'components/TelemetryStationMap';
import {TelemetryStationData} from 'components/TelemetryStationData';
import {TabNavigatorParamList, HomeStackParamList} from 'routes';
import {Observations} from 'components/Observations';
import {Observation} from 'components/Observation';
import {AvalancheCenterStackScreen} from 'components/screens/HomeScreen';
import {MenuStackScreen} from 'components/screens/MenuScreen';

if (Sentry?.init) {
  // we're reading a field that was previously defined in app.json, so we know it's non-null:
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dsn = Constants.expoConfig.extra!.sentry_dsn;
  // Only initialize Sentry if we can find the correct env setup
  if (dsn === 'LOADED_FROM_ENVIRONMENT') {
    console.warn('Sentry integration not configured, check your environment');
  } else {
    Sentry.init({
      dsn,
      enableInExpoDevelopment: false,
      debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
    });
  }
}

const queryClient: QueryClient = new QueryClient();

const TabNavigator = createBottomTabNavigator<TabNavigatorParamList>();

const AvalancheCenterTelemetryStack = createNativeStackNavigator<HomeStackParamList>();
const AvalancheCenterTelemetryStackScreen = (center_id: string, date: string) => {
  return (
    <AvalancheCenterTelemetryStack.Navigator initialRouteName="telemetryStations">
      <AvalancheCenterTelemetryStack.Screen
        name="telemetryStations"
        component={TelemetryScreen}
        initialParams={{center_id: center_id, date: date}}
        options={() => ({title: `${center_id} Telemetry Stations`})}
      />
      <AvalancheCenterTelemetryStack.Screen
        name="telemetryStation"
        component={TelemetryStationScreen}
        initialParams={{center_id: center_id, date: date}}
        options={({route}) => ({title: String(route.params.name)})}
      />
    </AvalancheCenterTelemetryStack.Navigator>
  );
};

const TelemetryScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const {center_id, date} = route.params;
  return (
    <View style={styles.container}>
      <TelemetryStationMap center_id={center_id} date={date} />
    </View>
  );
};

const TelemetryStationScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'telemetryStation'>) => {
  const {center_id, source, station_id} = route.params;
  return (
    <View style={styles.container}>
      <TelemetryStationData center_id={center_id} source={source} station_id={station_id} />
    </View>
  );
};

const ObservationsStack = createNativeStackNavigator<HomeStackParamList>();
const ObservationsStackScreen = (center_id: string, date: string) => {
  return (
    <ObservationsStack.Navigator initialRouteName="telemetryStations">
      <ObservationsStack.Screen
        name="observations"
        component={ObservationsScreen}
        initialParams={{center_id: center_id, date: date}}
        options={() => ({title: `${center_id} Observations`})}
      />
      <ObservationsStack.Screen name="observation" component={ObservationScreen} />
    </ObservationsStack.Navigator>
  );
};

const ObservationsScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'observations'>) => {
  const {center_id, date} = route.params;
  return (
    <View style={styles.container}>
      <Observations center_id={center_id} date={date} />
    </View>
  );
};

const ObservationScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'observation'>) => {
  const {id} = route.params;
  return (
    <View style={styles.container}>
      <Observation id={id} />
    </View>
  );
};

const onAppStateChange = (status: AppStateStatus) => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

// For now, we are implicitly interested in today's forecast.
// If you want to investigate an issue on a different day, you can change this value.
// TODO: add a date picker
const defaultDate = formatISO(Date.now());

const theme = extendTheme({
  colors: {
    darkText: '#333333',
  },
});

const App = () => {
  try {
    useOnlineManager();

    useAppState(onAppStateChange);

    // Set up ClientContext values
    const [avalancheCenter, setAvalancheCenter] = React.useState(defaults.avalancheCenter);
    const [staging, setStaging] = React.useState(false);

    const contextValue = {
      ...(staging ? stagingHosts : productionHosts),
    };

    const [date] = React.useState(defaultDate);

    return (
      <ClientContext.Provider value={contextValue}>
        <QueryClientProvider client={queryClient}>
          <NativeBaseProvider theme={theme}>
            <SafeAreaProvider>
              <NavigationContainer>
                <TabNavigator.Navigator
                  initialRouteName="Home"
                  screenOptions={({route}) => ({
                    headerShown: false,
                    tabBarIcon: ({color, size}) => {
                      if (route.name === 'Home') {
                        return <AntDesign name="search1" size={size} color={color} />;
                      } else if (route.name === 'Observations') {
                        return <AntDesign name="filetext1" size={size} color={color} />;
                      } else if (route.name === 'Weather Data') {
                        return <AntDesign name="barschart" size={size} color={color} />;
                      } else if (route.name === 'Menu') {
                        return <AntDesign name="bars" size={size} color={color} />;
                      }
                    },
                  })}>
                  <TabNavigator.Screen name="Home">{() => AvalancheCenterStackScreen(avalancheCenter, date)}</TabNavigator.Screen>
                  <TabNavigator.Screen name="Observations">{() => ObservationsStackScreen(avalancheCenter, date)}</TabNavigator.Screen>
                  <TabNavigator.Screen name="Weather Data">{() => AvalancheCenterTelemetryStackScreen(avalancheCenter, date)}</TabNavigator.Screen>
                  <TabNavigator.Screen name="Menu" initialParams={{center_id: avalancheCenter}}>
                    {() => MenuStackScreen(avalancheCenter, setAvalancheCenter, staging, setStaging)}
                  </TabNavigator.Screen>
                </TabNavigator.Navigator>
              </NavigationContainer>
            </SafeAreaProvider>
          </NativeBaseProvider>
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
