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
import {NavigationContainer} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {AppStateStatus, Image, Platform, StatusBar, StyleSheet, View} from 'react-native';
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
import ImageCache from 'hooks/useCachedImageURI';
import {useOnlineManager} from 'hooks/useOnlineManager';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {prefetchAllActiveForecasts} from 'network/prefetchAllActiveForecasts';
import Toast from 'react-native-toast-message';
import {TabNavigatorParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
require('date-time-format-timezone');

import axios, {AxiosRequestConfig} from 'axios';
import {createLogger, stdSerializers} from 'browser-bunyan';
import {ConsoleFormattedStream} from 'logging/consoleFormattedStream';

import ExpoMixpanelAnalytics from '@bothrs/expo-mixpanel-analytics';

// we're reading a field that was previously defined in app.json, so we know it's non-null:
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logLevel = Constants.expoConfig.extra!.log_level;

const logger = createLogger({
  name: 'avalanche-forecast',
  level: logLevel,
  serializers: stdSerializers,
  stream: new ConsoleFormattedStream(),
});

logger.info('App starting.');

if(ExpoMixpanelAnalytics != null)
{
  // we're reading a field that was previously defined in app.json, so we know it's non-null:
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const mixpanel_token = Constants.expoConfig.extra!.mixpanel;
  logger.info('Mixpanel is initializing.');
  // Only initialize Mixpanel if we can find the correct env setup
  if (mixpanel_token === 'LOADED_FROM_ENVIRONMENT' || mixpanel_token == null) {
    logger.warn('Mixpanel integration not configured, check your environment');
  }
  else
  {
    const analytics = new ExpoMixpanelAnalytics(mixpanel_token);
    analytics.track("App starting.");
  }
}

const encodeParams = params => {
  return Object.entries(params)
    .map(kv => kv.map(encodeURIComponent).join('='))
    .join('&');
};
const formatURI = (request: AxiosRequestConfig): string => {
  let msg = `${request.method.toUpperCase()} ${request.url}`;
  if (request.params && Object.keys(request.params).length !== 0) {
    msg += `?${encodeParams(request.params)}`;
  }
  if (request.data) {
    msg += ` data: ${request.data}`;
  }
  return msg;
};
axios.interceptors.request.use(request => {
  const msg = 'sending request';
  const thisLogger = logger.child({uri: formatURI(request)});
  thisLogger.debug(msg);
  if (request.data) {
    thisLogger.trace({data: request.data}, msg);
  }
  return request;
});

axios.interceptors.response.use(response => {
  const msg = 'received request response';
  const thisLogger = logger.child({uri: formatURI(response.config), status: response.status});
  thisLogger.debug(msg);
  if (response.data) {
    thisLogger.trace({data: response.data}, msg);
  }
  return response;
});

// The SplashScreen stays up until we've loaded all of our fonts and other assets
SplashScreen.preventAutoHideAsync();

if (Sentry?.init) {
  // we're reading a field that was previously defined in app.json, so we know it's non-null:
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dsn = Constants.expoConfig.extra!.sentry_dsn;
  // Only initialize Sentry if we can find the correct env setup
  if (dsn === 'LOADED_FROM_ENVIRONMENT') {
    logger.warn('Sentry integration not configured, check your environment');
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
queryCache.subscribe(event => ImageCache.cleanup(event, logger));

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
  await ImageCache.reconcile(queryClient, queryCache, logger);
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
BackgroundFetch.registerTaskAsync(BACKGROUND_CACHE_RECONCILIATION_TASK, {
  minimumInterval: 15 * 60, // fifteen minutes, in seconds
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

clearUploadCache();

const TabNavigator = createBottomTabNavigator<TabNavigatorParamList>();

const onAppStateChange = (status: AppStateStatus) => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

const toastConfig = {
  success: props => <SuccessToast content={props.text1} {...props} />,
  info: props => <InfoToast content={props.text1} {...props} />,
  action: props => <ActionToast content={props.text1} {...props} />,
  error: props => <ErrorToast content={props.text1} {...props} />,
  warning: props => <WarningToast content={props.text1} {...props} />,
};

const App = () => {
  try {
    useOnlineManager();

    useAppState(onAppStateChange);

    return (
      <LoggerContext.Provider value={{logger: logger}}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{persister: asyncStoragePersister}}>
          <AppWithClientContext />
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
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const [avalancheCenterId, setAvalancheCenterId] = React.useState(Constants.expoConfig.extra.avalanche_center as AvalancheCenterID);

  const {nationalAvalancheCenterHost, nwacHost} = React.useContext<ClientProps>(ClientContext);
  const queryClient = useQueryClient();
  useEffect(() => {
    (async () => {
      try {
        await prefetchAllActiveForecasts(queryClient, avalancheCenterId, nationalAvalancheCenterHost, nwacHost, logger);
      } catch (e) {
        logger.error({error: e}, 'error prefetching data');
      }
    })();
  }, [logger, queryClient, avalancheCenterId, nationalAvalancheCenterHost, nwacHost]);

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
    NAC_Icons: require('./assets/fonts/nac-icons.ttf'),
  });

  if (error) {
    logger.error({error: error}, 'error loading fonts');
  }

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
    <>
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
                        return <Image style={{tintColor: color, width: size, height: size}} resizeMode="contain" source={require('assets/icons/tab_bar/home.png')} />;
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
                  <TabNavigator.Screen name="Home" initialParams={{center_id: avalancheCenterId, requestedTime: 'latest'}}>
                    {state => HomeTabScreen(merge(state, {route: {params: {center_id: avalancheCenterId}}}))}
                  </TabNavigator.Screen>
                  <TabNavigator.Screen name="Observations" initialParams={{center_id: avalancheCenterId, requestedTime: 'latest'}}>
                    {state =>
                      ObservationsTabScreen(
                        merge(state, {
                          route: {
                            params: {
                              center_id: avalancheCenterId,
                            },
                          },
                        }),
                      )
                    }
                  </TabNavigator.Screen>
                  <TabNavigator.Screen name="Weather Data" initialParams={{center_id: avalancheCenterId, requestedTime: 'latest'}}>
                    {state => WeatherScreen(merge(state, {route: {params: {center_id: avalancheCenterId}}}))}
                  </TabNavigator.Screen>
                  <TabNavigator.Screen name="Menu" initialParams={{center_id: avalancheCenterId, requestedTime: 'latest'}}>
                    {state => MenuStackScreen(state, queryCache, avalancheCenterId, setAvalancheCenterId, staging, setStaging)}
                  </TabNavigator.Screen>
                </TabNavigator.Navigator>
              </View>
            </SelectProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </HTMLRendererConfig>
      <Toast config={toastConfig} bottomOffset={88} visibilityTime={2000} />
    </>
  );
};

export default App;
