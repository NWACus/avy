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
import {sponsorLogoSize} from 'data/sponsors';
import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';
import {useAnalytics} from 'hooks/useAnalytics';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {getUpdateGroupId} from 'hooks/useEASUpdateStatus';
import {useTitleSponsor} from 'hooks/useTitleSponsor';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {sendMail} from 'network/sendMail';
import {usePreferences} from 'Preferences';
import React, {useCallback, useMemo, useState} from 'react';
import {Alert, ColorValue, Image, Pressable, ScrollView, TouchableOpacity} from 'react-native';
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
    analytics.capture('sponsorSectionTapped');
    setShowSponsorDrawer(true);
  }, [setShowSponsorDrawer, analytics]);

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

const SPONSOR_LOGO_WIDTH = 150;

const SponsorSection: React.FunctionComponent<{onPress: () => void}> = ({onPress}) => {
  const sponsor = useTitleSponsor();
  const logoStyle = useMemo(() => sponsorLogoSize(sponsor.logoOnLight, SPONSOR_LOGO_WIDTH), [sponsor.logoOnLight]);

  return (
    <VStack pl={16} bg={'white'} paddingBottom={8}>
      <TouchableOpacity onPress={onPress}>
        <VStack paddingTop={8}>
          <AllCapsSm color={colorLookup('text.secondary')} textAlign="center">
            AVY, {sponsor.splashMessage}
          </AllCapsSm>
          <Center>
            <Image source={sponsor.logoOnLight} resizeMode="contain" style={logoStyle} />
          </Center>
        </VStack>
      </TouchableOpacity>
    </VStack>
  );
};

const SponsorDrawer: React.FunctionComponent<{visible: boolean; onDismiss: () => void}> = ({visible, onDismiss}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const analytics = useAnalytics();
  const sponsor = useTitleSponsor();
  const logoStyle = useMemo(() => sponsorLogoSize(sponsor.logoOnLight, SPONSOR_LOGO_WIDTH), [sponsor.logoOnLight]);

  const visitSponsor = useCallback(() => {
    analytics.capture('vistSponsorURLTapped');
    WebBrowser.openBrowserAsync(sponsor.campaignUrl).catch((e: unknown) => {
      logger.error({error: e}, 'Failed to open title sponsor URL');
      Alert.alert('Unable to Open Web Browser', 'An error occured when trying to open the web browser. Please try again.', [
        {
          text: 'Okay',
          style: 'default',
        },
      ]);
    });
  }, [analytics, logger, sponsor.campaignUrl]);

  const renderVisitButton = useCallback(
    ({textColor}: {backgroundColor: ColorValue | undefined; textColor: ColorValue}) => (
      <HStack space={8} alignItems="center" justifyContent="center">
        <BodyBlack color={textColor}>{sponsor.visitButtonTitle}</BodyBlack>
        <Ionicons name="open-outline" size={bodySize + 4} color={textColor} />
      </HStack>
    ),
    [sponsor.visitButtonTitle],
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
          <Image source={sponsor.logoOnLight} resizeMode="contain" style={logoStyle} />
        </Center>
        <VStack space={16} paddingBottom={16}>
          <Title3Semibold textAlign="center">Why we partner with {sponsor.displayName}</Title3Semibold>
          <Body textAlign="center" color={colorLookup('text.secondary')}>
            {sponsor.aboutSponsor}
          </Body>
          <Body textAlign="center" color={colorLookup('text.secondary')}>
            {sponsor.whyWePartner}
          </Body>
        </VStack>
        <Button buttonStyle="primary" onPress={visitSponsor} renderChildren={renderVisitButton} />
      </VStack>
    </DrawerModal>
  );
};
