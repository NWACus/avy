import React from 'react';

import {AppStateStatus, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AntDesign} from '@expo/vector-icons';
import {useFonts, Lato_400Regular, Lato_700Bold, Lato_900Black} from '@expo-google-fonts/lato';

import Constants from 'expo-constants';
import * as Sentry from 'sentry-expo';

import {formatISO} from 'date-fns';
import {focusManager, QueryClient, QueryClientProvider} from 'react-query';

import {NativeBaseProvider, extendTheme} from 'native-base';

import {ClientContext, productionHosts, stagingHosts} from 'clientContext';
import {useAppState} from 'hooks/useAppState';
import {useOnlineManager} from 'hooks/useOnlineManager';
import {TabNavigatorParamList} from 'routes';
import {HomeTabScreen} from 'components/screens/HomeScreen';
import {MenuStackScreen} from 'components/screens/MenuScreen';
import {ObservationsTabScreen} from 'components/screens/ObservationsScreen';
import {TelemetryTabScreen} from 'components/screens/TelemetryScreen';

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
});

const App = () => {
  try {
    useOnlineManager();

    useAppState(onAppStateChange);

    // Set up ClientContext values
    const [avalancheCenterId, setAvalancheCenterId] = React.useState(Constants.expoConfig.extra.avalanche_center);
    const [staging, setStaging] = React.useState(false);

    const contextValue = {
      ...(staging ? stagingHosts : productionHosts),
    };

    const [date] = React.useState(defaultDate);

    const [fontsLoaded] = useFonts({
      Lato_400Regular,
      Lato_900Black,
      Lato_700Bold,
    });

    if (!fontsLoaded) {
      // TODO(brian): should this be a loading screen? Sounds like yes, see
      // https://docs.expo.dev/guides/using-custom-fonts/#waiting-for-fonts-to-load
      return null;
    }
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
