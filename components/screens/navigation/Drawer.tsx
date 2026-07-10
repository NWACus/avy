import Ionicons from '@expo/vector-icons/Ionicons';
import {createDrawerNavigator, DrawerContentComponentProps} from '@react-navigation/drawer';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import {nacAvalancheCenterDescriptions} from 'components/avalancheCenterList';
import {ActionList} from 'components/content/ActionList';
import {Button} from 'components/content/Button';
import {DrawerModal, DrawerModalDisplayType} from 'components/content/DrawerModal';
import {CenterFocusedDrawerHeader} from 'components/content/navigation/CenterFocusedDrawerHeader';
import {NoCenterDrawerHeader} from 'components/content/navigation/NoCenterDrawerHeader';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {Center, HStack, View, VStack} from 'components/core';
import {getVersionInfoFull} from 'components/screens/main/Version';
import {MainStackNavigator} from 'components/screens/navigation/MainStack';
import {AllCapsSm, Body, BodyBlack, bodySize, Title3Semibold} from 'components/text';
import {settingsMenuItems} from 'data/settingsMenuItems';
import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';
import {useAnalytics} from 'hooks/useAnalytics';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {getUpdateGroupId} from 'hooks/useEASUpdateStatus';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {sendMail} from 'network/sendMail';
import {usePreferences} from 'Preferences';
import React, {useCallback, useMemo, useState} from 'react';
import {ColorValue, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DrawerParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, userFacingCenterId} from 'types/nationalAvalancheCenter';
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

  const [showSponsorDrawer, setShowSponsorDrawer] = useState(false);

  const displayId = useMemo(() => {
    if (capabilities) {
      return userFacingCenterId(avalancheCenterId, capabilities);
    }
    return '';
  }, [avalancheCenterId, capabilities]);

  const description = useMemo(() => nacAvalancheCenterDescriptions().find(nacCenter => nacCenter.center === avalancheCenterId)?.description ?? '', [avalancheCenterId]);

  const {
    preferences: {mixpanelUserId},
  } = usePreferences();
  const [updateGroupId] = getUpdateGroupId();

  const analytics = useAnalytics();

  const recordAnalytics = useCallback(() => {
    analytics.screen('menu');
  }, [analytics]);
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
    navigation.navigate('MainStack', {screen: 'avalancheCenterSelector'});
  }, [navigation]);

  const navigateToAbout = useCallback(() => {
    navigation.navigate('MainStack', {screen: 'about'});
  }, [navigation]);

  const navigateToDeveloperMenu = useCallback(() => {
    navigation.navigate('MainStack', {screen: 'developerMenu', params: {staging: staging, setStaging: setStaging}});
  }, [navigation, staging, setStaging]);

  const openSponsorDrawer = useCallback(() => {
    setShowSponsorDrawer(true);
  }, [setShowSponsorDrawer]);

  const closeSponsorDrawer = useCallback(() => {
    setShowSponsorDrawer(false);
  }, [setShowSponsorDrawer]);

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
      <View style={{paddingTop: insets.top, backgroundColor: '#333333'}}>
        {isInNoCenterExperience ? (
          <NoCenterDrawerHeader />
        ) : (
          <CenterFocusedDrawerHeader avalancheCenterId={avalancheCenterId} centerFullName={data?.name ?? ''} centerDisplayId={displayId} centerDescription={description} />
        )}
      </View>

      <ScrollView style={{flex: 1}}>
        <VStack width="100%" height="100%" justifyContent="flex-start" alignItems="stretch" bg={colorLookup('primary.background')} space={10}>
          <SponsorSection onPress={openSponsorDrawer} />

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

          <View py={12} px={32}>
            <Button buttonStyle="primary" onPress={sendMailHandler}>
              <BodyBlack>Submit App Feedback</BodyBlack>
            </Button>
          </View>

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
      <SponsorDrawer visible={showSponsorDrawer} onDismiss={closeSponsorDrawer} />
    </View>
  );
};

const SponsorSection: React.FunctionComponent<{onPress: () => void}> = ({onPress}) => {
  return (
    <VStack pl={16} bg={'white'} paddingBottom={8}>
      <View borderBottomWidth={1} borderColor={colorLookup('light.300')} py={10}>
        <BodyBlack>Our sponsor</BodyBlack>
      </View>
      <TouchableOpacity onPress={onPress}>
        <VStack paddingTop={8}>
          <AllCapsSm color={colorLookup('text.secondary')} textAlign="center">
            AVY, IN PARTNERSHIP WITH
          </AllCapsSm>
          <Center>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
            <Image source={require('assets/logos/Nokian_Tyres_Logo.jpg')} style={styles.logo} />
          </Center>
        </VStack>
      </TouchableOpacity>
    </VStack>
  );
};

const NOKIAN_TYRES_URL = 'https://na.nokiantyres.com/?utm_medium=referral&utm_source=3rd%20Party&utm_campaign=Nokian_Tyres_Avy';
const SponsorDrawer: React.FunctionComponent<{visible: boolean; onDismiss: () => void}> = ({visible, onDismiss}) => {
  const visitNokianTyres = useCallback(() => {
    void WebBrowser.openBrowserAsync(NOKIAN_TYRES_URL);
  }, []);

  const renderVisitButton = useCallback(
    ({textColor}: {backgroundColor: ColorValue | undefined; textColor: ColorValue}) => (
      <HStack space={8} alignItems="center" justifyContent="center">
        <BodyBlack color={textColor}>Visit nokiantyres.com</BodyBlack>
        <Ionicons name="open-outline" size={bodySize + 4} color={textColor} />
      </HStack>
    ),
    [],
  );

  return (
    <DrawerModal isVisible={visible} onDismiss={onDismiss} drawerDisplayType={DrawerModalDisplayType.fullScreen}>
      <VStack alignItems="stretch" px={16} pb={16}>
        <View alignItems="flex-end">
          <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close">
            <Center width={32} height={32} borderRadius={16} bg={colorLookup('gray.100')}>
              <Ionicons name="close" size={20} color={colorLookup('text.secondary')} />
            </Center>
          </Pressable>
        </View>
        <Center>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
          <Image source={require('assets/logos/Nokian_Tyres_Logo.jpg')} style={styles.logo} />
        </Center>
        <VStack space={16} paddingBottom={16}>
          <Title3Semibold textAlign="center">Why we partner with Nokian Tyres</Title3Semibold>
          <Body textAlign="center" color={colorLookup('text.secondary')}>
            Nokian Tyres invented the winter tire in 1934 and has spent ninety years helping people travel safely through snow and ice.
          </Body>
          <Body textAlign="center" color={colorLookup('text.secondary')}>
            Their support keeps the AvyApp free for every backcountry traveler: no banner ads, no paywall, easy access to the forecasts you rely on.
          </Body>
        </VStack>
        <Button buttonStyle="primary" onPress={visitNokianTyres} renderChildren={renderVisitButton} />
      </VStack>
    </DrawerModal>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 150,
    height: 150 * (416 / 1024),
    resizeMode: 'contain',
  },
});
