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
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {SelectProvider} from '@mobile-reality/react-native-select-pro';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, useNavigationContainerRef} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {AppStateStatus, Platform, StatusBar, StyleSheet, useColorScheme, View} from 'react-native';
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

import {ClientContext, ClientProps, productionHosts, stagingHosts} from 'clientContext';
import {ActionToast, ErrorToast, InfoToast, SuccessToast, WarningToast} from 'components/content/Toast';
import {clearUploadCache} from 'components/observations/submitObservation';
import {HomeTabScreen} from 'components/screens/HomeScreen';
import {MenuStackScreen} from 'components/screens/MenuScreen';
import {ObservationsTabScreen} from 'components/screens/ObservationsScreen';
import {WeatherScreen} from 'components/screens/WeatherScreen';
import {HTMLRendererConfig} from 'components/text/HTML';
import {useAppState} from 'hooks/useAppState';
import ImageCache, {queryKeyPrefix} from 'hooks/useCachedImageURI';
import {useOnlineManager} from 'hooks/useOnlineManager';
import {IntlProvider} from 'intl';
import {logFilePath, logger} from 'logger';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {prefetchAllActiveForecasts} from 'network/prefetchAllActiveForecasts';
import Toast, {ToastConfigParams} from 'react-native-toast-message';
import {TabNavigatorParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
require('date-time-format-timezone');

import axios, {AxiosRequestConfig} from 'axios';
import {QUERY_CACHE_ASYNC_STORAGE_KEY} from 'data/asyncStorageKeys';
import * as FileSystem from 'expo-file-system';
import {PreferencesProvider, usePreferences} from 'Preferences';
// eslint-disable-next-line no-restricted-imports
import {TamaguiProvider, Theme} from 'tamagui';
import config from 'tamagui.config';
import {NotFoundError} from 'types/requests';
import {formatRequestedTime, RequestedTime} from 'utils/date';

import * as messages from 'compiled-lang/en.json';

logger.info('App starting.');

const encodeParams = (params: {[s: string]: string}) => {
  return Object.entries(params)
    .map(kv => kv.map(encodeURIComponent).join('='))
    .join('&');
};
const formatURI = (request: AxiosRequestConfig): string => {
  const method = request.method ?? 'GET';
  let msg = `${method.toUpperCase()} ${request.url ?? 'url'}`;
  if (request.params && Object.keys(request.params as {[s: string]: string}).length !== 0) {
    msg += `?${encodeParams(request.params as {[s: string]: string})}`;
  }
  if (request.data) {
    msg += ` data: ${JSON.stringify(request.data)}`;
  }
  return msg;
};
axios.interceptors.request.use(request => {
  const msg = 'sending request';
  const thisLogger = logger.child({uri: formatURI(request)});
  thisLogger.debug(msg);
  if (request.data) {
    thisLogger.trace({data: JSON.stringify(request.data)}, msg);
  }
  return request;
});

axios.interceptors.response.use(response => {
  const msg = 'received request response';
  const thisLogger = logger.child({uri: formatURI(response.config), status: response.status});
  thisLogger.debug(msg);
  if (response.data) {
    thisLogger.trace({data: JSON.stringify(response.data)}, msg);
  }
  return response;
});

// The SplashScreen stays up until we've loaded all of our fonts and other assets
void SplashScreen.preventAutoHideAsync();

if (Sentry?.init) {
  const dsn = (Constants.expoConfig?.extra?.sentry_dsn as string) ?? 'LOADED_FROM_ENVIRONMENT';
  // Only initialize Sentry if we can find the correct env setup
  if (dsn === 'LOADED_FROM_ENVIRONMENT') {
    logger.warn('Sentry integration not configured, check your environment');
  } else {
    Sentry.init({
      dsn,
      enableInExpoDevelopment: Boolean(process.env.EXPO_PUBLIC_SENTRY_IN_DEV),
      enableWatchdogTerminationTracking: true,
      beforeSend: async (event, hint) => {
        const {exists} = await FileSystem.getInfoAsync(logFilePath);
        if (exists) {
          const data = await FileSystem.readAsStringAsync(logFilePath);
          hint.attachments = [{filename: 'log.json', data, contentType: 'application/json'}];
        }
        return event;
      },
    });
  }
}

const queryCache: QueryCache = new QueryCache();
// we need to subscribe to the react-query cache in order to remove
// images from the local filesystem when their TTL expires
queryCache.subscribe(event => {
  if (event.type !== 'removed') {
    return;
  }

  const key: unknown = event.query.queryKey;
  if (!(key instanceof Array) || key.length < 2 || key[0] !== queryKeyPrefix) {
    return;
  }

  const values = key[1] as Record<string, string>;
  if (!('uri' in values) || !values['uri'] || !values['uri'].startsWith('http')) {
    return;
  }

  const data = event.query.state.data as string;
  logger.debug({source: values['uri'], destination: data}, 'cleaning up remote image');
  void FileSystem.deleteAsync(data, {idempotent: true});
  // TODO: handle errors?
});

const queryClient: QueryClient = new QueryClient({
  queryCache: queryCache,
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: (failureCount, error): boolean => !(error instanceof NotFoundError), // 404s are terminal
    },
  },
});

// on startup and periodically, reconcile the react-query link cache with the filesystem
const BACKGROUND_CACHE_RECONCILIATION_TASK = 'background-cache-reconciliation';
TaskManager.defineTask(BACKGROUND_CACHE_RECONCILIATION_TASK, () => {
  void (async () => {
    try {
      await ImageCache.reconcile(queryClient, queryCache, logger);
    } catch (e) {
      logger.error({error: e}, 'error reconciling image cache');
    }
  })();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
void BackgroundFetch.registerTaskAsync(BACKGROUND_CACHE_RECONCILIATION_TASK, {
  minimumInterval: 15 * 60, // fifteen minutes, in seconds
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_ASYNC_STORAGE_KEY,
});

void clearUploadCache();

const TabNavigator = createBottomTabNavigator<TabNavigatorParamList>();

const onAppStateChange = (status: AppStateStatus) => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

const toastConfig = {
  success: (props: ToastConfigParams<string>) => <SuccessToast content={props.text1 ?? 'Success'} {...props} />,
  info: (props: ToastConfigParams<string>) => <InfoToast content={props.text1 ?? 'Info'} {...props} />,
  action: (props: ToastConfigParams<string>) => <ActionToast content={props.text1 ?? 'Action'} {...props} />,
  error: (props: ToastConfigParams<string>) => <ErrorToast content={props.text1 ?? 'Error'} {...props} />,
  warning: (props: ToastConfigParams<string>) => <WarningToast content={props.text1 ?? 'Warning'} {...props} />,
};

const App = () => {
  try {
    useOnlineManager();

    useAppState(onAppStateChange);

    return (
      <LoggerContext.Provider value={{logger: logger}}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{persister: asyncStoragePersister}}>
          <IntlProvider locale="en" defaultLocale="en" messages={messages}>
            <AppWithClientContext />
          </IntlProvider>
        </PersistQueryClientProvider>
      </LoggerContext.Provider>
    );
  } catch (error) {
    Sentry.Native.captureException(error);
    throw error;
  }
};

const AppWithClientContext = () => {
  const [staging, setStaging] = React.useState(false);
  const [requestedTime, setRequestedTime] = React.useState<RequestedTime>(process.env.EXPO_PUBLIC_DATE ? new Date(process.env.EXPO_PUBLIC_DATE) : 'latest');

  const contextValue = {
    ...(staging ? stagingHosts : productionHosts),
    requestedTime,
    setRequestedTime,
  };

  return (
    <ClientContext.Provider value={contextValue}>
      <PreferencesProvider>
        <BaseApp staging={staging} setStaging={setStaging} />
      </PreferencesProvider>
    </ClientContext.Provider>
  );
};

const BaseApp: React.FunctionComponent<{
  staging: boolean;
  setStaging: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({staging, setStaging}) => {
  const colorScheme = useColorScheme();
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const {preferences, setPreferences} = usePreferences();
  const avalancheCenterId = preferences.center;
  const setAvalancheCenterId = useCallback(
    (avalancheCenterId: AvalancheCenterID) => {
      setPreferences({center: avalancheCenterId});
    },
    [setPreferences],
  );

  const {nationalAvalancheCenterHost, nationalAvalancheCenterWordpressHost, nwacHost, snowboundHost, requestedTime} = React.useContext<ClientProps>(ClientContext);
  const queryClient = useQueryClient();
  useEffect(() => {
    void (async () => {
      if (process.env.EXPO_PUBLIC_DISABLE_PREFETCHING) {
        logger.info('skipping prefetch because EXPO_PUBLIC_DISABLE_PREFETCHING is set');
      } else {
        try {
          await prefetchAllActiveForecasts(queryClient, avalancheCenterId, nationalAvalancheCenterHost, nationalAvalancheCenterWordpressHost, nwacHost, snowboundHost, logger);
        } catch (e) {
          logger.error({error: e}, 'error prefetching data');
        }
      }
    })();
  }, [logger, queryClient, avalancheCenterId, nationalAvalancheCenterHost, nationalAvalancheCenterWordpressHost, nwacHost, snowboundHost]);

  const [fontsLoaded, error] = useFonts({
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
    // typing the return of `require()` here does nothing for us
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    NAC_Icons: require('./assets/fonts/nac-icons.ttf'),
  });

  if (error) {
    logger.error({error: error}, 'error loading fonts');
  }

  const navigationRef = useNavigationContainerRef();

  // Hide the splash screen after fonts load. We're careful not to call hideAsync more than once;
  // this seems to be the cause of the "No native splash screen registered" errors.
  // TODO: for maximum seamlessness, hide it after the map view is ready
  const [splashScreenState, setSplashScreenState] = React.useState<'visible' | 'hiding' | 'hidden'>('visible');
  useEffect(() => {
    void (async () => {
      if (fontsLoaded && splashScreenState === 'visible') {
        setSplashScreenState('hiding');
        await SplashScreen.hideAsync();
        setSplashScreenState('hidden');
      }
    })();
  }, [fontsLoaded, splashScreenState, setSplashScreenState]);

  if (!fontsLoaded || splashScreenState !== 'hidden') {
    // The splash screen keeps rendering while fonts are loading
    return null;
  }

  return (
    <>
      <TamaguiProvider config={config}>
        <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
          <HTMLRendererConfig>
            <SafeAreaProvider>
              <NavigationContainer ref={navigationRef}>
                <SelectProvider>
                  <StatusBar barStyle="dark-content" />
                  <View style={StyleSheet.absoluteFill}>
                    <TabNavigator.Navigator
                      initialRouteName="Home"
                      screenOptions={({route}) => ({
                        headerShown: false,
                        tabBarIcon: ({color, size}) => {
                          if (route.name === 'Home') {
                            return <MaterialCommunityIcons name="map-outline" size={size} color={color} />;
                          } else if (route.name === 'Observations') {
                            return <MaterialCommunityIcons name="text-box-plus-outline" size={size} color={color} />;
                          } else if (route.name === 'Weather Data') {
                            return <Ionicons name="stats-chart-outline" size={size} color={color} />;
                          } else if (route.name === 'Menu') {
                            return <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />;
                          }
                        },
                        // these two properties should really take ColorValue but oh well
                        tabBarActiveTintColor: colorLookup('primary') as string,
                        tabBarInactiveTintColor: colorLookup('text.secondary') as string,
                      })}>
                      <TabNavigator.Screen name="Home" initialParams={{center_id: avalancheCenterId}} options={{title: 'Map'}}>
                        {state => HomeTabScreen(merge(state, {route: {params: {center_id: avalancheCenterId, requestedTime: formatRequestedTime(requestedTime)}}}))}
                      </TabNavigator.Screen>
                      <TabNavigator.Screen name="Observations" initialParams={{center_id: avalancheCenterId}}>
                        {state =>
                          ObservationsTabScreen(
                            merge(state, {
                              route: {
                                params: {
                                  center_id: avalancheCenterId,
                                  requestedTime: formatRequestedTime(requestedTime),
                                },
                              },
                            }),
                          )
                        }
                      </TabNavigator.Screen>
                      <TabNavigator.Screen name="Weather Data" initialParams={{center_id: avalancheCenterId}}>
                        {state => WeatherScreen(merge(state, {route: {params: {center_id: avalancheCenterId, requestedTime: formatRequestedTime(requestedTime)}}}))}
                      </TabNavigator.Screen>
                      <TabNavigator.Screen name="Menu" initialParams={{center_id: avalancheCenterId}}>
                        {state => MenuStackScreen(state, queryCache, avalancheCenterId, setAvalancheCenterId, staging, setStaging)}
                      </TabNavigator.Screen>
                    </TabNavigator.Navigator>
                  </View>
                </SelectProvider>
              </NavigationContainer>
            </SafeAreaProvider>
          </HTMLRendererConfig>
        </Theme>
      </TamaguiProvider>
      <Toast config={toastConfig} bottomOffset={88} visibilityTime={2000} />
    </>
  );
};

export default App;
