import React from 'react';

import {AppStateStatus, DevSettings, Platform, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {AntDesign} from '@expo/vector-icons';

import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo';

import {formatISO} from 'date-fns';
import {focusManager, QueryClient, QueryClientProvider} from 'react-query';

import {ClientContext, productionClientProps, stagingClientProps} from './clientContext';
import {AvalancheForecastZoneMap} from './components/AvalancheForecastZoneMap';
import {AvalancheForecast} from './components/AvalancheForecast';
import {AvalancheCenterSelector} from './components/AvalancheCenterSelector';
import {useAppState} from './hooks/useAppState';
import {useOnlineManager} from './hooks/useOnlineManager';
import {TelemetryStationMap} from './components/TelemetryStationMap';
import {TelemetryStationData} from './components/TelemetryStationData';
import {TabNavigatorParamList, HomeStackParamList} from './routes';
import {Observations} from './components/Observations';
import {Observation} from './components/Observation';

Sentry.init({
  // we're overwriting a field that was previously defined in app.json, so we know it's non-null:
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  dsn: Constants.expoConfig.extra!.sentry_dsn,
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

const queryClient: QueryClient = new QueryClient();

const TabNavigator = createBottomTabNavigator<TabNavigatorParamList>();

const AvalancheCenterStack = createNativeStackNavigator<HomeStackParamList>();
const AvalancheCenterStackScreen = (center_id: string, date: string) => {
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

const MapScreen = ({route}: NativeStackScreenProps<HomeStackParamList, 'avalancheCenter'>) => {
  const {center_id, date} = route.params;
  return (
    <View style={{...styles.container}}>
      <AvalancheForecastZoneMap centers={[center_id]} date={date} />
    </View>
  );
};

type ForecastScreenProps = NativeStackScreenProps<HomeStackParamList, 'forecast'>;
const ForecastScreen = ({route}: ForecastScreenProps) => {
  const {center_id, forecast_zone_id, date} = route.params;
  return (
    <View style={styles.container}>
      <AvalancheForecast center_id={center_id} forecast_zone_id={forecast_zone_id} date={date} />
    </View>
  );
};

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

function PlaceholderScreen(label: string) {
  return (
    <View style={{...styles.container, flex: 1, justifyContent: 'space-between', alignItems: 'center'}}>
      <Text>This is top text.</Text>
      <Text style={{fontSize: 24, fontWeight: 'bold'}}>View name: {label}</Text>
      <Text>This is bottom text.</Text>
    </View>
  );
}

// For now, we are implicitly interested in today's forecast.
// If you want to investigate an issue on a different day, you can change this value.
// TODO: add a date picker
const defaultDate = formatISO(Date.now());
export const defaultCenterId = 'NWAC';

const App = () => {
  try {
    useOnlineManager();

    useAppState(onAppStateChange);

    const [avalancheCenter, setAvalancheCenter] = React.useState(defaultCenterId);
    const [date] = React.useState(defaultDate);

    const [contextValue, setContextValue] = React.useState(productionClientProps);

    React.useEffect(() => {
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
              <SafeAreaView style={styles.container}>
                <TabNavigator.Navigator
                  initialRouteName="Home"
                  screenOptions={({route}) => ({
                    headerShown: false,
                    tabBarIcon: ({focused, color, size}) => {
                      if (route.name === 'Home') {
                        return <AntDesign name="search1" size={size} color={color} />;
                      } else if (route.name === 'Observations') {
                        return <AntDesign name="filetext1" size={size} color={color} />;
                      } else if (route.name === 'Weather Data') {
                        return <AntDesign name="barschart" size={size} color={color} />;
                      } else if (route.name === 'Menu') {
                        return <AntDesign name="bars" size={size} color={color} />;
                      } else if (route.name === 'Debug') {
                        return <AntDesign name="database" size={size} color={color} />;
                      }
                    },
                  })}>
                  <TabNavigator.Screen name="Home">{() => AvalancheCenterStackScreen(avalancheCenter, date)}</TabNavigator.Screen>
                  <TabNavigator.Screen name="Observations">{() => ObservationsStackScreen(avalancheCenter, date)}</TabNavigator.Screen>
                  <TabNavigator.Screen name="Weather Data">{() => AvalancheCenterTelemetryStackScreen(avalancheCenter, date)}</TabNavigator.Screen>
                  <TabNavigator.Screen name="Menu" initialParams={{center_id: avalancheCenter}}>
                    {() => PlaceholderScreen('Menu')}
                  </TabNavigator.Screen>
                  {__DEV__ && (
                    <TabNavigator.Screen name="Debug">
                      {() => (
                        <View style={styles.container}>
                          <AvalancheCenterSelector setAvalancheCenter={setAvalancheCenter} />
                        </View>
                      )}
                    </TabNavigator.Screen>
                  )}
                </TabNavigator.Navigator>
              </SafeAreaView>
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
