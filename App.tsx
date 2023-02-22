import React, {useCallback, useEffect} from 'react';

import {
  Lato_100Thin,
  Lato_100Thin_Italic,
  Lato_300Light,
  Lato_300Light_Italic,
  Lato_400Regular,
  Lato_400Regular_Italic,
  Lato_700Bold,
  Lato_700Bold_Italic,
  Lato_900Black,
  Lato_900Black_Italic,
  useFonts,
} from '@expo-google-fonts/lato';
import {AntDesign} from '@expo/vector-icons';
import {SelectProvider} from '@mobile-reality/react-native-select-pro';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {AppStateStatus, Platform, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import * as BackgroundFetch from 'expo-background-fetch';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';
import * as Sentry from 'sentry-expo';

import {merge} from 'lodash';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import {focusManager, QueryCache, QueryClient, useQueryClient} from '@tanstack/react-query';
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';

import axios from 'axios';
import {ClientContext, ClientProps, productionHosts, stagingHosts} from 'clientContext';
import {HomeTabScreen} from 'components/screens/HomeScreen';
import {MenuStackScreen} from 'components/screens/MenuScreen';
import {ObservationsTabScreen} from 'components/screens/ObservationsScreen';
import {WeatherScreen} from 'components/screens/WeatherScreen';
import {HTMLRendererConfig} from 'components/text/HTML';
import {useAppState} from 'hooks/useAppState';
import ImageCache from 'hooks/useCachedImageURI';
import {useOnlineManager} from 'hooks/useOnlineManager';
import {prefetchAllActiveForecasts} from 'network/prefetchAllActiveForecasts';
import {TabNavigatorParamList} from 'routes';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {toISOStringUTC} from 'utils/date';

// we're reading a field that was previously defined in app.json, so we know it's non-null:
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
if (Constants.expoConfig.extra!.log_requests) {
  axios.interceptors.request.use(request => {
    console.log(
      'Request:',
      JSON.stringify(
        {
          method: request.method,
          url: request.url,
          params: request.params,
        },
        null,
        2,
      ),
    );
    return request;
  });
}

// The SplashScreen stays up until we've loaded all of our fonts and other assets
SplashScreen.preventAutoHideAsync();

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

const queryCache: QueryCache = new QueryCache();
// we need to subscribe to the react-query cache in order to remove
// images from the local filesystem when their TTL expires
queryCache.subscribe(event => ImageCache.cleanup(event));

const queryClient: QueryClient = new QueryClient({
  queryCache: queryCache,
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// on startup and periodically, reconcile the react-query link cache with the filesystem
const BACKGROUND_CACHE_RECONCILIATION_TASK = 'background-cache-reconciliation';
TaskManager.defineTask(BACKGROUND_CACHE_RECONCILIATION_TASK, async () => {
  await ImageCache.reconcile(queryClient, queryCache);
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
BackgroundFetch.registerTaskAsync(BACKGROUND_CACHE_RECONCILIATION_TASK, {
  minimumInterval: 60 * 60, // one hour, in seconds
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const TabNavigator = createBottomTabNavigator<TabNavigatorParamList>();

const onAppStateChange = (status: AppStateStatus) => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

// For now, we are implicitly interested in today's forecast.
// If you want to investigate an issue on a different day, you can change this value.
// TODO: add a date picker
const defaultDate = new Date();

const App = () => {
  try {
    useOnlineManager();

    useAppState(onAppStateChange);

    return (
      <PersistQueryClientProvider client={queryClient} persistOptions={{persister: asyncStoragePersister}}>
        <AppWithClientContext />
      </PersistQueryClientProvider>
    );
  } catch (error) {
    Sentry.Native.captureException(error);
    throw error;
  }
};

const AppWithClientContext = () => {
  const [staging, setStaging] = React.useState(false);

  const contextValue = {
    ...(staging ? stagingHosts : productionHosts),
  };

  return (
    <ClientContext.Provider value={contextValue}>
      <BaseApp staging={staging} setStaging={setStaging} />
    </ClientContext.Provider>
  );
};

const BaseApp: React.FunctionComponent<{
  staging: boolean;
  setStaging: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({staging, setStaging}) => {
  const [avalancheCenterId, setAvalancheCenterId] = React.useState(Constants.expoConfig.extra.avalanche_center as AvalancheCenterID);
  const [date] = React.useState<Date>(defaultDate);
  const dateString = toISOStringUTC(date);

  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const queryClient = useQueryClient();
  useEffect(() => {
    (async () => {
      await prefetchAllActiveForecasts(queryClient, avalancheCenterId, date, nationalAvalancheCenterHost);
    })();
  }, [queryClient, avalancheCenterId, date, nationalAvalancheCenterHost]);

  const [fontsLoaded] = useFonts({
    Lato_100Thin,
    Lato_100Thin_Italic,
    Lato_300Light,
    Lato_300Light_Italic,
    Lato_400Regular_Italic,
    Lato_400Regular,
    Lato_700Bold,
    Lato_700Bold_Italic,
    Lato_900Black,
    Lato_900Black_Italic,
    NAC_Icons: require('./assets/fonts/nac-icons.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    // This callback won't execute until fontsLoaded is true, because
    // otherwise we won't render the view that triggers this callback
    await SplashScreen.hideAsync();
  }, []);

  if (!fontsLoaded) {
    // The splash screen keeps rendering while fonts are loading
    return null;
  }

  return (
    <HTMLRendererConfig>
      <SafeAreaProvider>
        <NavigationContainer>
          <SelectProvider>
            <StatusBar barStyle="dark-content" />
            <View onLayout={onLayoutRootView} style={StyleSheet.absoluteFill}>
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
                <TabNavigator.Screen name="Home" initialParams={{center_id: avalancheCenterId, dateString}}>
                  {state => HomeTabScreen(merge(state, {route: {params: {center_id: avalancheCenterId, dateString}}}))}
                </TabNavigator.Screen>
                <TabNavigator.Screen name="Observations" initialParams={{center_id: avalancheCenterId, dateString}}>
                  {state =>
                    ObservationsTabScreen(
                      merge(state, {
                        route: {
                          params: {
                            center_id: avalancheCenterId,
                            dateString,
                          },
                        },
                      }),
                    )
                  }
                </TabNavigator.Screen>
                <TabNavigator.Screen name="Weather Data" initialParams={{center_id: avalancheCenterId, dateString}}>
                  {state => WeatherScreen(merge(state, {route: {params: {center_id: avalancheCenterId, dateString}}}))}
                </TabNavigator.Screen>
                <TabNavigator.Screen name="Menu" initialParams={{center_id: avalancheCenterId}}>
                  {() => MenuStackScreen(avalancheCenterId, setAvalancheCenterId, staging, setStaging)}
                </TabNavigator.Screen>
              </TabNavigator.Navigator>
            </View>
          </SelectProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </HTMLRendererConfig>
  );
};

export default App;
