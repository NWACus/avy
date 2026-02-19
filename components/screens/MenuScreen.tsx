import React, {useCallback} from 'react';

import {ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {RouteProp, useFocusEffect, useNavigation} from '@react-navigation/native';
import {MenuStackNavigationProps, MenuStackParamList, TabNavigatorParamList} from 'routes';

import {View, VStack} from 'components/core';

import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';

import {QueryCache} from '@tanstack/react-query';

import {AvalancheCenters} from 'components/avalancheCenterList';
import {ActionList} from 'components/content/ActionList';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {FeatureFlagsDebuggerScreen} from 'components/FeatureFlagsDebugger';
import {ForecastScreen} from 'components/screens/ForecastScreen';
import {MapScreen} from 'components/screens/MapScreen';
import {AboutScreen} from 'components/screens/menu/AboutScreen';
import {
  AvalancheComponentPreview,
  ButtonStylePreview,
  DeveloperMenu,
  ExpoConfigScreen,
  OutcomeScreen,
  TextStylePreview,
  TimeMachine,
  ToastPreview,
} from 'components/screens/menu/DeveloperMenu';
import {getVersionInfoFull} from 'components/screens/menu/Version';
import {NWACObservationScreen, ObservationScreen} from 'components/screens/ObservationsScreen';
import {Body, BodyBlack, Title3Black} from 'components/text';
import {settingsMenuItems} from 'data/settingsMenuItems';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {getUpdateGroupId} from 'hooks/useEASUpdateStatus';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {sendMail} from 'network/sendMail';
import {usePostHog} from 'posthog-react-native';
import {usePreferences} from 'Preferences';
import {colorLookup} from 'theme';
import {AvalancheCenterID, userFacingCenterId} from 'types/nationalAvalancheCenter';

const MenuStack = createNativeStackNavigator<MenuStackParamList>();
export const MenuStackScreen = (
  {route}: NativeStackScreenProps<TabNavigatorParamList, 'Menu'>,
  queryCache: QueryCache,
  staging: boolean,
  setStaging: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const {requestedTime} = route.params;
  const {preferences, setPreferences} = usePreferences();

  const centerId = preferences.center;
  const avalancheCenterSelectorOptions = useCallback(
    ({route}: {route: RouteProp<MenuStackParamList, 'avalancheCenterSelector'>}) => ({
      headerShown: true,
      title: `Select Avalanche Center${route.params.debugMode ? ' (debug)' : ''}`,
    }),
    [],
  );

  const setAvalancheCenter = useCallback(
    (avalancheCenterId: AvalancheCenterID) => {
      setPreferences({center: avalancheCenterId});
    },
    [setPreferences],
  );

  return (
    <MenuStack.Navigator initialRouteName="menu" screenOptions={{headerShown: true}}>
      <MenuStack.Screen name="menu" component={MenuScreen(queryCache, centerId, staging, setStaging)} options={{title: `Settings`, headerShown: false}} />
      <MenuStack.Screen
        name="avalancheCenterSelector"
        component={AvalancheCenterSelectorScreen(AvalancheCenters.SupportedCenters, centerId, setAvalancheCenter)}
        options={avalancheCenterSelectorOptions}
      />
      <MenuStack.Screen name="buttonStylePreview" component={ButtonStylePreview} options={{title: `Button Style Preview`}} />
      <MenuStack.Screen name="textStylePreview" component={TextStylePreview} options={{title: `Text Style Preview`}} />
      <MenuStack.Screen name="avalancheComponentPreview" component={AvalancheComponentPreview} options={{title: `Avalanche Component Preview`}} />
      <MenuStack.Screen name="toastPreview" component={ToastPreview} options={{title: `Toast Preview`}} />
      <MenuStack.Screen name="timeMachine" component={TimeMachine} options={{title: `Time Machine`}} />
      <MenuStack.Screen name="avalancheCenter" component={MapScreen} initialParams={{center_id: centerId, requestedTime: requestedTime}} options={{headerShown: false}} />
      <MenuStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: centerId, requestedTime: requestedTime}} options={{headerShown: false}} />
      <MenuStack.Screen name="observation" component={ObservationScreen} />
      <MenuStack.Screen name="nwacObservation" component={NWACObservationScreen} />
      <MenuStack.Screen name="about" component={AboutScreen} options={{title: 'Avy'}} />
      <MenuStack.Screen name="outcome" component={OutcomeScreen} options={{title: `Outcome Preview`}} />
      <MenuStack.Screen name="expoConfig" component={ExpoConfigScreen} options={{title: `Expo Configuration Viewer`}} />
      <MenuStack.Screen name="featureFlags" component={FeatureFlagsDebuggerScreen} options={{title: `Feature Flag Debugger`}} />
    </MenuStack.Navigator>
  );
};

export const MenuScreen = (queryCache: QueryCache, avalancheCenterId: AvalancheCenterID, staging: boolean, setStaging: React.Dispatch<React.SetStateAction<boolean>>) => {
  const MenuScreen = function (_: NativeStackScreenProps<MenuStackParamList, 'menu'>) {
    const {logger} = React.useContext<LoggerProps>(LoggerContext);
    const navigation = useNavigation<MenuStackNavigationProps>();
    const {data} = useAvalancheCenterMetadata(avalancheCenterId);
    const menuItems = settingsMenuItems[avalancheCenterId];
    const capabilitiesResult = useAvalancheCenterCapabilities();
    const capabilities = capabilitiesResult.data;

    const {
      preferences: {mixpanelUserId},
    } = usePreferences();
    const [updateGroupId] = getUpdateGroupId();

    const postHog = usePostHog();

    const recordAnalytics = useCallback(() => {
      postHog?.screen('menu');
    }, [postHog]);
    useFocusEffect(recordAnalytics);
    const sendMailHandler = useCallback(
      () =>
        void sendMail({
          to: 'developer+app-feedback@nwac.us',
          subject: 'NWAC app feedback',
          footer: `Please do not delete, info below helps with debugging.\n\n ${getVersionInfoFull(mixpanelUserId, updateGroupId)}`,
          logger,
        }),
      [logger, mixpanelUserId, updateGroupId],
    );

    if (incompleteQueryState(capabilitiesResult) || !capabilities) {
      return <QueryState results={[capabilitiesResult]} />;
    }

    return (
      <View style={{...StyleSheet.absoluteFillObject}} bg="white">
        {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
        <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
          <ScrollView style={{width: '100%', height: '100%'}}>
            <VStack width="100%" height="100%" justifyContent="flex-start" alignItems="stretch" bg={colorLookup('primary.background')} space={10}>
              <Card borderRadius={0} borderColor="white" header={<Title3Black>More</Title3Black>} noDivider>
                <Body>
                  {data?.name && `${data.name} `}({userFacingCenterId(avalancheCenterId, capabilities)})
                </Body>
              </Card>
              <View py={12} px={32}>
                <Button buttonStyle="primary" onPress={sendMailHandler}>
                  <BodyBlack>Submit App Feedback</BodyBlack>
                </Button>
              </View>
              <ActionList
                header={<BodyBlack>Settings</BodyBlack>}
                bg="white"
                pl={16}
                actions={[
                  {
                    label: 'Select avalanche center',
                    data: 'Center',
                    action: () => {
                      navigation.navigate('avalancheCenterSelector', {debugMode: false});
                    },
                  },
                  {
                    label: 'About Avy',
                    data: 'About',
                    action: () => {
                      navigation.navigate('about');
                    },
                  },
                ]}
              />
              {menuItems && menuItems.length > 0 && (
                <ActionList
                  header={<BodyBlack>General</BodyBlack>}
                  bg="white"
                  pl={16}
                  actions={menuItems.map(item => ({
                    label: item.title,
                    data: item.title,
                    action: () => {
                      void WebBrowser.openBrowserAsync(item.url);
                    },
                  }))}
                />
              )}
              {Updates.channel !== 'release' && <DeveloperMenu staging={staging} setStaging={setStaging} />}
            </VStack>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };
  MenuScreen.displayName = 'MenuScreen';
  return MenuScreen;
};

export const AvalancheCenterSelectorScreen = (centers: AvalancheCenters, avalancheCenterId: AvalancheCenterID, setAvalancheCenter: (center: AvalancheCenterID) => void) => {
  const AvalancheCenterSelectorScreen = function (_: NativeStackScreenProps<MenuStackParamList, 'avalancheCenterSelector'>) {
    return <AvalancheCenterSelector currentCenterId={avalancheCenterId} setAvalancheCenter={setAvalancheCenter} />;
  };
  AvalancheCenterSelectorScreen.displayName = 'AvalancheCenterSelectorScreen';
  return AvalancheCenterSelectorScreen;
};
