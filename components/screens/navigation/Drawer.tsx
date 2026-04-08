import {createDrawerNavigator, DrawerContentComponentProps} from '@react-navigation/drawer';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {ActionList} from 'components/content/ActionList';
import {Button} from 'components/content/Button';
import {NoCenterDrawerHeader} from 'components/content/navigation/NoCenterDrawerHeader';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {getVersionInfoFull} from 'components/screens/main/Version';
import {MainStackNavigator} from 'components/screens/navigation/MainStack';
import {BodyBlack, Title3Semibold} from 'components/text';
import {settingsMenuItems} from 'data/settingsMenuItems';
import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {getUpdateGroupId} from 'hooks/useEASUpdateStatus';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {sendMail} from 'network/sendMail';
import {usePostHog} from 'posthog-react-native';
import {usePreferences} from 'Preferences';
import React, {useCallback, useMemo} from 'react';
import {ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DrawerParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {RequestedTime} from 'utils/date';

const Drawer = createDrawerNavigator<DrawerParamList>();
export const DrawerNavigator: React.FunctionComponent<{
  requestedTime: RequestedTime;
  centerId: AvalancheCenterID;
  isInNoCenterExperience: boolean;
  staging: boolean;
  setStaging: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({requestedTime, centerId, isInNoCenterExperience, staging, setStaging}) => {
  const renderDrawer = useCallback(
    (props: DrawerContentComponentProps) => (
      <DrawerMenu avalancheCenterId={centerId} isInNoCenterExperience={isInNoCenterExperience} staging={staging} setStaging={setStaging} {...props} />
    ),
    [centerId, isInNoCenterExperience, staging, setStaging],
  );

  const renderMainStack = useCallback(
    (_: {route: RouteProp<DrawerParamList, 'MainStack'>}) => (
      <MainStackNavigator centerId={centerId} isInNoCenterExperience={isInNoCenterExperience} requestedTime={requestedTime} staging={staging} setStaging={setStaging} />
    ),
    [requestedTime, centerId, isInNoCenterExperience, staging, setStaging],
  );
  return (
    <Drawer.Navigator initialRouteName="MainStack" drawerContent={renderDrawer} screenOptions={{swipeEnabled: false}}>
      <Drawer.Screen name="MainStack" options={{headerShown: false}}>
        {renderMainStack}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
};

interface DrawerMenuProps extends DrawerContentComponentProps {
  avalancheCenterId: AvalancheCenterID;
  isInNoCenterExperience: boolean;
  staging: boolean;
  setStaging: React.Dispatch<React.SetStateAction<boolean>>;
}

const DrawerMenu: React.FunctionComponent<DrawerMenuProps> = ({navigation, avalancheCenterId, isInNoCenterExperience, staging, setStaging}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

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

  const navigateToCenterSelection = useCallback(() => {
    navigation.navigate('MainStack', {screen: 'avalancheCenterSelector', params: {debugMode: false}});
  }, [navigation]);

  const navigateToAbout = useCallback(() => {
    navigation.navigate('MainStack', {screen: 'about'});
  }, [navigation]);

  const navigateToDeveloperMenu = useCallback(() => {
    navigation.navigate('MainStack', {screen: 'developerMenu', params: {staging: staging, setStaging: setStaging}});
  }, [navigation, staging, setStaging]);

  const menuActions = useMemo(
    () =>
      menuItems.map(item => ({
        label: item.title,
        data: item.title,
        action: () => {
          void WebBrowser.openBrowserAsync(item.url);
        },
      })),
    [menuItems],
  );

  const insets = useSafeAreaInsets();

  if (incompleteQueryState(capabilitiesResult) || !capabilities) {
    return <QueryState results={[capabilitiesResult]} />;
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView style={{flex: 1}}>
        <VStack width="100%" height="100%" justifyContent="flex-start" alignItems="stretch" bg={colorLookup('primary.background')} space={10}>
          {isInNoCenterExperience ? (
            <View style={{paddingTop: insets.top, backgroundColor: '#333333'}}>
              <NoCenterDrawerHeader />
            </View>
          ) : (
            <HStack flex={1} paddingHorizontal={16} paddingBottom={8} pt={insets.top} backgroundColor={'white'} justifyContent="space-between">
              <Title3Semibold style={{flex: 2}}>{data?.name && data.name}</Title3Semibold>
              <AvalancheCenterLogo style={{height: 48, width: 48, resizeMode: 'contain'}} avalancheCenterId={avalancheCenterId} />
            </HStack>
          )}
          <View py={12} px={32}>
            <Button buttonStyle="primary" onPress={sendMailHandler}>
              <BodyBlack>Submit App Feedback</BodyBlack>
            </Button>
          </View>
          {!isInNoCenterExperience && menuItems && menuItems.length > 0 && <ActionList header={<BodyBlack>General</BodyBlack>} bg="white" pl={16} actions={menuActions} />}
          <ActionList
            header={<BodyBlack>Settings</BodyBlack>}
            bg="white"
            pl={16}
            actions={[
              {
                label: 'Select avalanche center',
                data: 'Center',
                action: navigateToCenterSelection,
              },
              {
                label: 'About Avy',
                data: 'About',
                action: navigateToAbout,
              },
            ]}
          />
          {Updates.channel !== 'release' && (
            <ActionList
              header={<BodyBlack>Developer Menu</BodyBlack>}
              bg="white"
              pl={16}
              actions={[
                {
                  label: 'Open Dev Menu',
                  data: '',
                  action: navigateToDeveloperMenu,
                },
              ]}
            />
          )}
        </VStack>
      </ScrollView>
    </View>
  );
};
