import Ionicons from '@expo/vector-icons/Ionicons';
import {getHeaderTitle} from '@react-navigation/elements';
import {DrawerActions} from '@react-navigation/native';
import {NativeStackHeaderProps} from '@react-navigation/native-stack';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, View} from 'components/core';
import {GenerateObservationShareLink} from 'components/observations/ObservationUrlMapping';
import {Title3, Title3Black} from 'components/text';
import {logger} from 'logger';
import {usePreferences} from 'Preferences';
import React, {useCallback} from 'react';
import {Platform, Share} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheCenterWebsites, reverseLookup} from 'types/nationalAvalancheCenter';

const isMainTabScreen = (routeName: string): boolean => routeName === 'observationsList' || routeName === 'stationList' || routeName === 'avalancheCenter';

export const NavigationHeader: React.FunctionComponent<NativeStackHeaderProps> = ({navigation, route, options, back}) => {
  const {preferences} = usePreferences();
  const centerId = preferences.center;

  let share: boolean = false;
  let firstOpen: boolean = false;
  let shareCenterId: AvalancheCenterID = centerId;
  const shareParams: {share: boolean; share_url: string} = route?.params as {share: boolean; share_url: string};

  if (shareParams?.share) {
    share = true;
    // if back is false, means the obs screens have not been open yet
    if (!back) {
      firstOpen = true;
      // set back to not be null since we want a shared obs to have a back button
      back = {title: 'Observations', href: undefined};
    }

    shareCenterId = reverseLookup(AvalancheCenterWebsites, shareParams.share_url) as AvalancheCenterID;
  }

  const isMainScreen = isMainTabScreen(route.name);

  const title = isMainScreen ? (centerId as string) : getHeaderTitle(options, route.name);
  const TextComponent = isMainScreen ? Title3Black : Title3;
  const insets = useSafeAreaInsets();
  const goBack = useCallback(() => {
    if (share) {
      navigation.navigate('Observations');
    }

    navigation.goBack();
  }, [navigation, share]);

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  // if app is open for the first time, say from a link that was shared that can open in the app, reset navigation to go back to home (map screen)
  const reset = useCallback(
    () =>
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      }),
    [navigation],
  );

  let shareUrl: string | null = null;
  if (route.name === 'observation' || route.name === 'nwacObservation') {
    const params = route.params;
    if (params && 'id' in params) {
      const observationId = params.id as string;
      shareUrl = GenerateObservationShareLink(shareCenterId, observationId);
      logger.info(`Share URL: ${shareUrl}`);
    }
  }

  const onShareButtonPress = useCallback(() => {
    if (!shareUrl) {
      return;
    }

    Share.share({
      message: shareUrl,
    }).catch((error: object) => logger.error(error, 'share button failed'));
  }, [shareUrl]);

  return (
    // On phones with notches, the insets.top value will be non-zero and we don't need additional padding on top.
    // On phones without notches, the insets.top value will be 0 and we don't want the header to be flush with the top of the screen.
    <View style={{width: '100%', backgroundColor: colorLookup('white'), paddingTop: insets.top, justifyContent: 'center', alignContent: 'center'}}>
      <HStack justifyContent="space-between" style={options.headerStyle} space={8} pl={3} pr={16}>
        {back ? (
          <Ionicons.Button
            size={24}
            color={colorLookup('primary')}
            name="arrow-back-outline"
            backgroundColor={colorLookup('white')}
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={firstOpen ? reset : goBack}
          />
        ) : (
          // Add an empty component to take up space and maintain consistent spacing when the button
          // is not shown.
          <Ionicons.Button
            size={24}
            color={colorLookup('primary')}
            name="menu"
            backgroundColor={colorLookup('white')}
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={openDrawer}
          />
        )}
        {isMainScreen ? (
          <HStack space={4}>
            <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain'}} avalancheCenterId={centerId} />
            <TextComponent textAlign="center" style={{borderColor: 'transparent', borderWidth: 1, color: colorLookup('text')}}>
              {title}
            </TextComponent>
          </HStack>
        ) : (
          <TextComponent textAlign="center" style={{flex: 1, borderColor: 'transparent', borderWidth: 1, color: colorLookup('text')}}>
            {title}
          </TextComponent>
        )}

        {shareUrl ? (
          <Ionicons.Button
            size={24}
            color={colorLookup('primary')}
            name={Platform.OS == 'ios' ? 'share-outline' : 'share-social'}
            backgroundColor={colorLookup('white')}
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={onShareButtonPress}
          />
        ) : (
          // Add an empty component to take up space and maintain consistent spacing when the button
          // is not shown.
          <View width={24} />
        )}
      </HStack>
    </View>
  );
};
