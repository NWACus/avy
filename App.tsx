import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {SelectProvider} from '@mobile-reality/react-native-select-pro';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getStateFromPath, NavigationContainer, PathConfigMap, RouteProp, useNavigationContainerRef} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {ActivityIndicator, AppState, AppStateStatus, Image, Platform, StatusBar, StyleSheet, UIManager, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import * as BackgroundFetch from 'expo-background-fetch';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';

import {merge} from 'lodash';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import {focusManager, QueryCache, QueryClient, useQueryClient} from '@tanstack/react-query';
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';

import {ClientContext, ClientProps, productionHosts, stagingHosts} from 'clientContext';
import {ActionToast, ErrorToast, InfoToast, SuccessToast, WarningToast} from 'components/content/Toast';
import {HomeTabScreen} from 'components/screens/HomeScreen';
import {MenuStackScreen} from 'components/screens/MenuScreen';
import {ObservationsTabScreen} from 'components/screens/ObservationsScreen';
import {WeatherScreen} from 'components/screens/WeatherScreen';
import {HTMLRendererConfig} from 'components/text/HTML';
import ImageCache, {queryKeyPrefix} from 'hooks/useCachedImageURI';
import {useOnlineManager} from 'hooks/useOnlineManager';
import {IntlProvider} from 'intl';
import {logFilePath, logger} from 'logger';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {prefetchAllActiveForecasts} from 'network/prefetchAllActiveForecasts';
import Toast, {ToastConfigParams} from 'react-native-toast-message';
import {TabNavigatorParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterWebsites} from 'types/nationalAvalancheCenter';

import 'date-time-format-timezone';

import axios, {AxiosRequestConfig} from 'axios';
import {QUERY_CACHE_ASYNC_STORAGE_KEY} from 'data/asyncStorageKeys';
import * as FileSystem from 'expo-file-system';
import {PreferencesProvider, usePreferences} from 'Preferences';
import {NotFoundError} from 'types/requests';
import {formatRequestedTime, RequestedTime} from 'utils/date';

import Mapbox from '@rnmapbox/maps';
import {Integration} from '@sentry/types';
import {TRACE} from 'browser-bunyan';
import * as messages from 'compiled-lang/en.json';
import {Button} from 'components/content/Button';
import {Center, VStack} from 'components/core';
import {KillSwitchMonitor} from 'components/KillSwitchMonitor';
import {Body, BodyBlack, Title3Black} from 'components/text';
import * as Linking from 'expo-linking';
import * as Updates from 'expo-updates';
import {FeatureFlagsProvider} from 'FeatureFlags';
import {useToggle} from 'hooks/useToggle';
import {filterLoggedData} from 'logging/filterLoggedData';
import {PostHogProvider} from 'posthog-react-native';
import {startupUpdateCheck, UpdateStatus} from 'Updates';
import {ZodError} from 'zod';

logger.info('App starting.');

Mapbox.setAccessToken(Constants.expoConfig?.extra?.mapboxAPIKey as string).catch((error: Error) => {
  logger.error('Failed to initialize mapbox with error: ', error);
});

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  logger.info('enabling android layout animations');
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const encodeParams = (params: {[s: string]: string}) => {
  return Object.entries(params)
    .map(kv => kv.map(encodeURIComponent).join('='))
    .join('&');
};

const formatURI = (
  request: AxiosRequestConfig,
  options: {
    includePostData?: boolean;
    verbose?: boolean;
  } = {},
): string => {
  const method = request.method ?? 'GET';
  let msg = `${method.toUpperCase()} ${request.url ?? 'url'}`;
  if (request.params && Object.keys(request.params as {[s: string]: string}).length !== 0) {
    msg += `?${encodeParams(
      options.verbose
        ? (request.params as {
            [s: string]: string;
          })
        : (filterLoggedData(request.params) as {[s: string]: string}),
    )}`;
  }
  if (request.data && options.includePostData) {
    msg += ` data: ${JSON.stringify(options.verbose ? request.data : filterLoggedData(request.data))}`;
  }
  return msg;
};

axios.defaults.headers.common['User-Agent'] = `avy/${Application.nativeApplicationVersion || '0.0.0'}.${Application.nativeBuildVersion || '0'}+${
  Updates.channel || 'development'
}-${process.env.EXPO_PUBLIC_GIT_REVISION || 'git-revision'}`;

axios.interceptors.request.use(request => {
  const msg = 'sending request';
  const level = logger.level();
  const thisLogger = logger.child({
    uri: formatURI(request, {
      includePostData: level <= TRACE,
      verbose: level <= TRACE,
    }),
  });
  thisLogger.debug(msg);
  if (request.data && level <= TRACE) {
    thisLogger.trace(
      {
        data: JSON.stringify(request.data),
      },
      msg,
    );
  }
  return request;
});

axios.interceptors.response.use(response => {
  const msg = 'received request response';
  const level = logger.level();
  const thisLogger = logger.child({
    uri: formatURI(response.config, {includePostData: level <= TRACE}),
    status: response.status,
  });
  thisLogger.debug(msg);
  if (response.data && level <= TRACE) {
    thisLogger.trace({data: JSON.stringify(filterLoggedData(response.data))}, msg);
  }
  return response;
});

// The SplashScreen stays up until we've loaded all of our assets
void SplashScreen.preventAutoHideAsync().catch((error: Error) => {
  // We really don't care about these errors, they're common and not actionable
  logger.debug('SplashScreen.preventAutoHideAsync threw error, ignoring', {error});
});

let routingInstrumentation:
  | (Integration & {
      registerNavigationContainer: (navigationContainerRef: unknown) => void;
    })
  | undefined = undefined;
if (Sentry?.init) {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN as string;
  // Only initialize Sentry if we can find the correct env setup
  if (!dsn) {
    logger.warn('Sentry integration not configured, check your environment');
  } else {
    routingInstrumentation = Sentry.reactNavigationIntegration();
    Sentry.init({
      dsn,
      // Set the dist value to the app binary and build. This should not vary often.
      // Example: 1.0.0.54
      dist: `${Application.nativeApplicationVersion || '0.0.0'}.${Application.nativeBuildVersion || '0'}`,
      release: process.env.EXPO_PUBLIC_GIT_REVISION as string,
      enabled: !!Updates.channel && Updates.channel !== '',
      enableWatchdogTerminationTracking: true,
      integrations: [routingInstrumentation],
      beforeSend: async (event, hint) => {
        const {exists} = await FileSystem.getInfoAsync(logFilePath);
        if (exists) {
          const data = await FileSystem.readAsStringAsync(logFilePath);
          hint.attachments = [{filename: 'log.json', data, contentType: 'application/json'}];
        }
        event.tags = {
          ...(event.tags ?? {}),
          git_revision: process.env.EXPO_PUBLIC_GIT_REVISION as string,
        };
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
      retry: (failureCount, error): boolean => failureCount <= 3 && !(error instanceof NotFoundError) && !(error instanceof ZodError), // 404s and Zod errors are terminal
    },
  },
});

// on startup and periodically, reconcile the react-query link cache with the filesystem
const BACKGROUND_CACHE_RECONCILIATION_TASK = 'background-cache-reconciliation';
TaskManager.defineTask(BACKGROUND_CACHE_RECONCILIATION_TASK, async () => {
  try {
    await ImageCache.reconcile(queryClient, queryClient.getQueryCache(), logger);
  } catch (e) {
    logger.error({error: e}, 'error reconciling image cache');
  }
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
void BackgroundFetch.registerTaskAsync(BACKGROUND_CACHE_RECONCILIATION_TASK, {
  minimumInterval: 15 * 60, // fifteen minutes, in seconds
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_ASYNC_STORAGE_KEY,
});

const TabNavigator = createBottomTabNavigator<TabNavigatorParamList>();

// We add the listener at startup and never plan to stop listening, so there's
// no need to unsubscribe here.
AppState.addEventListener('change', (status: AppStateStatus) => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
});

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

    return (
      <LoggerContext.Provider value={{logger: logger}}>
        {/* we clear the query cache every time a new build is published */}
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: asyncStoragePersister,
            buster: (process.env.EXPO_PUBLIC_GIT_REVISION as string) || '',
          }}>
          <IntlProvider locale="en" defaultLocale="en" messages={messages}>
            <AppWithClientContext />
          </IntlProvider>
        </PersistQueryClientProvider>
      </LoggerContext.Provider>
    );
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
};

const AppWithClientContext = () => {
  const [staging, setStaging] = React.useState(false);
  const [requestedTime, setRequestedTime] = React.useState<RequestedTime>(process.env.EXPO_PUBLIC_DATE ? new Date(process.env.EXPO_PUBLIC_DATE as string) : 'latest');

  const contextValue = useMemo<ClientProps>(
    () => ({
      ...(staging ? stagingHosts : productionHosts),
      requestedTime,
      setRequestedTime,
    }),
    [staging, requestedTime],
  );

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
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const {preferences} = usePreferences();
  const avalancheCenterId = preferences.center;

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

  const navigationRef = useNavigationContainerRef();
  const trackNavigationChange = useCallback(() => {
    if (routingInstrumentation && navigationRef) {
      routingInstrumentation.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  const [splashScreenVisible, setSplashScreenVisible] = useState(true);
  useEffect(() => {
    // Hide the splash screen, but bake in a delay so that we are ready to render a view
    // that looks just like it
    if (splashScreenVisible) {
      setSplashScreenVisible(false);
      setTimeout(
        () =>
          void (async () => {
            try {
              await SplashScreen.hideAsync();
            } catch (error) {
              // We really don't care about these errors, they're common and not actionable
              logger.debug({error}, 'Error from SplashScreen.hideAsync, ignoring');
            }
          })(),
        500,
      );
    }
  }, [splashScreenVisible, setSplashScreenVisible, logger]);

  // Check for updates
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('checking');
  useEffect(() => {
    startupUpdateCheck()
      .then(setUpdateStatus)
      .catch((error: Error) => {
        logger.error({error}, 'Unexpected error checking for updates');
        // No need to keep blocking the app from loading
        setUpdateStatus('ready');
      });
  }, [setUpdateStatus, logger]);

  const tabNavigatorScreenOptions = useCallback(
    ({route: {name}}: {route: RouteProp<TabNavigatorParamList, keyof TabNavigatorParamList>}) => ({
      headerShown: false,
      tabBarIcon: ({color, size}: {focused: boolean; color: string; size: number}) => {
        if (name === 'Home') {
          return <MaterialCommunityIcons name="map-outline" size={size} color={color} />;
        } else if (name === 'Observations') {
          return <MaterialCommunityIcons name="text-box-plus-outline" size={size} color={color} />;
        } else if (name === 'Weather Data') {
          return <Ionicons name="stats-chart-outline" size={size} color={color} />;
        } else if (name === 'Menu') {
          return <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />;
        }
      },
      // these two properties should really take ColorValue but oh well
      tabBarActiveTintColor: colorLookup('primary') as string,
      tabBarInactiveTintColor: colorLookup('text.secondary') as string,
    }),
    [],
  );

  const [startupPaused, {off: unpauseStartup}] = useToggle(process.env.EXPO_PUBLIC_PAUSE_ON_STARTUP === 'true');

  if (updateStatus !== 'ready' || preferences.mixpanelUserId == '') {
    // Here, we render a view that looks exactly like the splash screen but now has an activity indicator
    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: Constants.expoConfig?.splash?.backgroundColor,
          },
        ]}>
        <Image
          style={{
            width: '100%',
            height: '100%',
            resizeMode: Constants.expoConfig?.splash?.resizeMode || 'contain',
          }}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
          source={require('./assets/splash.png')}
        />
        <Center style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}}>
          <ActivityIndicator size="large" style={{marginTop: 200}} />
        </Center>
      </View>
    );
  }

  if (startupPaused) {
    return (
      <Center bg="magenta" width="100%" height="100%" justifyContent="center" alignItems="center" px={64}>
        <VStack space={16}>
          <Title3Black>Waiting for startup delay...</Title3Black>
          <Body>You’re seeing this because EXPO_PUBLIC_PAUSE_ON_STARTUP is set.</Body>
          <Body>Attach your profiler now.</Body>
          <Button onPress={unpauseStartup} buttonStyle="primary">
            <BodyBlack>Let’s go</BodyBlack>
          </Button>
        </VStack>
      </Center>
    );
  }

  let initialUrl: string | null = null;
  // get the universal link the app was open with, if one exists
  Linking.getInitialURL()
    .then(url => {
      if (url) {
        initialUrl = url;
      }
    })
    .catch(err => {
      logger.error('An error occurred while getting InitialUrl.', err);
    });

  Linking.addEventListener('url', event => {
    initialUrl = event.url;
  });

  const linking = {
    prefixes: [
      // Prefixes are removed from URL before parsing
      AvalancheCenterWebsites['NWAC'],
    ],
    filter: (url: string) => url.includes('/observations/'), // Only handle observation links
    config: {
      screens: {
        Observations: {
          path: 'observations/#/view/observations',
          screens: {
            observationsList: '',
            observation: ':id',
          },
        },
      },
    },
    getStateFromPath: (
      path: string,
      opts:
        | {
            initialRouteName?: string;
            screens: PathConfigMap<object>;
          }
        | undefined,
    ) => {
      // Replace alternate observations path
      let newPath = path.replace('observations/#/observation', 'observations/#/view/observations');

      // Setup share URL for back controls
      if (initialUrl) {
        // this url contains the whole url, like so: https://nwac.us/observations/#/observations/fb5bb19a-2b89-4c9c-91d2-eb673c5ab877
        const origin = new URL(initialUrl).origin;
        if (origin !== 'null') {
          newPath += '?share=true&share_url=' + origin + '/';
        }
      }

      return getStateFromPath(newPath, opts);
    },
  };

  return (
    <>
      <HTMLRendererConfig>
        <SafeAreaProvider>
          <NavigationContainer linking={linking} ref={navigationRef} onReady={trackNavigationChange} onStateChange={trackNavigationChange}>
            <PostHogProvider
              apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY as string}
              options={{
                bootstrap: {
                  distinctId: preferences.mixpanelUserId,
                  isIdentifiedId: true,
                  featureFlags: {
                    'down-for-maintenance': false,
                    'update-required': false,
                  },
                },
              }}
              autocapture={{
                captureScreens: false, // we need to translate screen parameters to human-readable info, which requires HTTP request data, so we can't use the built-in screen capture with route property mapping feature
                captureLifecycleEvents: true,
              }}>
              <FeatureFlagsProvider>
                <KillSwitchMonitor>
                  <SelectProvider>
                    <StatusBar barStyle="dark-content" backgroundColor="white" />
                    <View style={{flex: 1}}>
                      <TabNavigator.Navigator initialRouteName="Home" screenOptions={tabNavigatorScreenOptions}>
                        <TabNavigator.Screen name="Home" initialParams={{requestedTime: formatRequestedTime(requestedTime)}} options={{title: 'Zones'}}>
                          {state =>
                            HomeTabScreen(
                              merge(state, {
                                route: {
                                  params: {
                                    requestedTime: formatRequestedTime(requestedTime),
                                  },
                                },
                              }),
                            )
                          }
                        </TabNavigator.Screen>
                        <TabNavigator.Screen name="Observations" initialParams={{requestedTime: formatRequestedTime(requestedTime)}}>
                          {state =>
                            ObservationsTabScreen(
                              merge(state, {
                                route: {
                                  params: {
                                    requestedTime: formatRequestedTime(requestedTime),
                                  },
                                },
                              }),
                            )
                          }
                        </TabNavigator.Screen>
                        <TabNavigator.Screen name="Weather Data" initialParams={{requestedTime: formatRequestedTime(requestedTime)}}>
                          {state =>
                            WeatherScreen(
                              merge(state, {
                                route: {
                                  params: {
                                    requestedTime: formatRequestedTime(requestedTime),
                                  },
                                },
                              }),
                            )
                          }
                        </TabNavigator.Screen>
                        <TabNavigator.Screen name="Menu" initialParams={{requestedTime: formatRequestedTime(requestedTime)}} options={{title: 'More'}}>
                          {state => MenuStackScreen(state, queryCache, staging, setStaging)}
                        </TabNavigator.Screen>
                      </TabNavigator.Navigator>
                    </View>
                  </SelectProvider>
                </KillSwitchMonitor>
              </FeatureFlagsProvider>
            </PostHogProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </HTMLRendererConfig>
      <Toast config={toastConfig} bottomOffset={88} visibilityTime={2000} />
    </>
  );
};

export default Sentry.wrap(App);
