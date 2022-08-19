import React, {Context} from 'react';

import {AppStateStatus, Platform, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {formatISO} from 'date-fns';
import {focusManager, QueryClient, QueryClientProvider} from 'react-query';

import {ClientContext, defaultClientProps} from './clientContext';
import {Map} from './components/Map';
import {AvalancheForecast} from './components/AvalancheForecast';
import {AvalancheCenterSelector} from './components/AvalancheCenterSelector';
import {useOnlineManager} from './hooks/useOnlineManager';
import {useAppState} from './hooks/useAppState';

const queryClient: QueryClient = new QueryClient();

const SelectorScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <AvalancheCenterSelector date={formatISO(new Date('2022-03-01'))} />
    </SafeAreaView>
  );
};

type MapScreenProps = NativeStackScreenProps<StackParamList, 'zoneSelector'>;
const MapScreen = ({route}: MapScreenProps) => {
  const {center_id, date} = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <Map centers={[center_id]} date={date} />
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

type StackParamList = {
  centerSelector: undefined;
  zoneSelector: {
    center_id: string;
    date: string;
  };
  forecast: {
    center_id: string;
    forecast_zone_id: number;
    date: string;
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
  useOnlineManager();

  useAppState(onAppStateChange);

  return (
    <ClientContext.Provider value={defaultClientProps}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="centerSelector">
              <Stack.Screen name="centerSelector" component={SelectorScreen} options={{title: 'Select an Avalanche Center'}} />
              <Stack.Screen name="zoneSelector" component={MapScreen} options={({route}) => ({title: route.params.center_id})} />
              <Stack.Screen name="forecast" component={ForecastScreen} options={({route}) => ({title: String(route.params.forecast_zone_id)})} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClientContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});

export default App;
