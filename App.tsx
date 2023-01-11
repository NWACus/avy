import React, {useCallback, useEffect} from 'react';

import {AppStateStatus, Platform, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AntDesign} from '@expo/vector-icons';
import {
  useFonts,
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
} from '@expo-google-fonts/lato';
import * as SplashScreen from 'expo-splash-screen';

import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo';

import {formatISO} from 'date-fns';
import {focusManager, QueryClient, QueryClientProvider, useQueryClient} from 'react-query';

import {NativeBaseProvider, extendTheme} from 'native-base';

import {ClientContext, ClientProps, productionHosts, stagingHosts} from 'clientContext';
import {useAppState} from 'hooks/useAppState';
import {useOnlineManager} from 'hooks/useOnlineManager';
import {TabNavigatorParamList} from 'routes';
import {HomeTabScreen} from 'components/screens/HomeScreen';
import {MenuStackScreen} from 'components/screens/MenuScreen';
import {ObservationsTabScreen} from 'components/screens/ObservationsScreen';
import {TelemetryTabScreen} from 'components/screens/TelemetryScreen';
import {AvalancheCenterID} from './types/nationalAvalancheCenter';
import {prefetchAllActiveForecasts} from './network/prefetchAllActiveForecasts';
import {HTMLRendererConfig} from 'components/text/HTML';

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

const queryClient: QueryClient = new QueryClient();

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
const defaultDate = formatISO(Date.now());

const theme = extendTheme({
  colors: {
    darkText: '#333333',
    lightText: '#999999',
  },
  fontConfig: {
    Lato: {
      100: {
        normal: 'Lato_100Thin',
        italic: 'Lato_100ThinItalic',
      },
      200: {
        normal: 'Lato_100Thin',
        italic: 'Lato_100ThinItalic',
      },
      300: {
        normal: 'Lato_300Light',
        italic: 'Lato_300LightItalic',
      },
      400: {
        normal: 'Lato_400Regular',
        italic: 'Lato_400RegularItalic',
      },
      500: {
        normal: 'Lato_400Regular',
        italic: 'Lato_400RegularItalic',
      },
      600: {
        normal: 'Lato_400Regular',
        italic: 'Lato_400RegularItalic',
      },
      700: {
        normal: 'Lato_700Bold',
        italic: 'Lato_700BoldItalic',
      },
      800: {
        normal: 'Lato_700Bold',
        italic: 'Lato_700BoldItalic',
      },
      900: {
        normal: 'Lato_900Black',
        italic: 'Lato_900BlackItalic',
      },
    },
  },
  fonts: {
    heading: 'Lato',
    body: 'Lato',
  },
});

const App = () => {
  try {
    useOnlineManager();

    useAppState(onAppStateChange);

    return (
      <QueryClientProvider client={queryClient}>
        <AppWithClientContext />
      </QueryClientProvider>
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
  const [date] = React.useState(defaultDate);

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
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // The splash screen keeps rendering while fonts are loading
    return null;
  }

  return (
    <NativeBaseProvider theme={theme}>
      <HTMLRendererConfig>
        <SafeAreaProvider>
          <NavigationContainer>
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
                <TabNavigator.Screen name="Home" initialParams={{center_id: avalancheCenterId, date: date}}>
                  {state => HomeTabScreen(withParams(state, {center_id: avalancheCenterId, date: date}))}
                </TabNavigator.Screen>
                <TabNavigator.Screen name="Observations" initialParams={{center_id: avalancheCenterId, date: date}}>
                  {state => ObservationsTabScreen(withParams(state, {center_id: avalancheCenterId, date: date}))}
                </TabNavigator.Screen>
                <TabNavigator.Screen name="Weather Data" initialParams={{center_id: avalancheCenterId, date: date}}>
                  {state => TelemetryTabScreen(withParams(state, {center_id: avalancheCenterId, date: date}))}
                </TabNavigator.Screen>
                <TabNavigator.Screen name="Menu" initialParams={{center_id: avalancheCenterId}}>
                  {() => MenuStackScreen(avalancheCenterId, setAvalancheCenterId, staging, setStaging)}
                </TabNavigator.Screen>
              </TabNavigator.Navigator>
            </View>
          </NavigationContainer>
        </SafeAreaProvider>
      </HTMLRendererConfig>
    </NativeBaseProvider>
  );
};

const withParams = (state, params) => {
  return {
    ...state,
    route: {
      ...state.route,
      params: {
        ...state.route.params,
        ...params,
      },
    },
  };
};

export default App;
