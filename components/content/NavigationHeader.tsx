import {AntDesign} from '@expo/vector-icons';
import {getHeaderTitle} from '@react-navigation/elements';
import {NativeStackHeaderProps} from '@react-navigation/native-stack/lib/typescript/src/types';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, View} from 'components/core';
import {Title1Black, Title3Black} from 'components/text';
import React, {useCallback} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheCenterWebsites} from 'types/nationalAvalancheCenter';

export const NavigationHeader: React.FunctionComponent<
  NativeStackHeaderProps & {
    center_id: AvalancheCenterID;
    large?: boolean;
  }
> = ({navigation, route, options, back, center_id, large}) => {
  let share: boolean = false;
  let firstOpen: boolean = false;
  let shareCenterId: AvalancheCenterID = center_id;
  const shareParams: {share: boolean; share_url: string} = route?.params as {share: boolean; share_url: string};

  if (shareParams.share) {
    share = true;
    // if back is false, means the obs screens have not been open yet
    if (!back) {
      firstOpen = true;
      // set back to not be null since we want a shared obs to have a back button
      back = {title: 'Observations'};
    }

    const flip = (data: Record<AvalancheCenterID, string>) => Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]));
    const AvalancheCenterWebsitesFlipped = flip(AvalancheCenterWebsites);
    shareCenterId = AvalancheCenterWebsitesFlipped[shareParams.share_url] as AvalancheCenterID;
  }

  const title = getHeaderTitle(options, route.name);
  const TextComponent = large ? Title1Black : Title3Black;
  const insets = useSafeAreaInsets();
  const goBack = useCallback(() => {
    if (share) {
      navigation.navigate('Observations');
    }

    navigation.goBack();
  }, [navigation, share]);

  // if app is open for the first time, say from a link that was shared that can open in the app, reset navigation to go back to home (map screen)
  const reset = useCallback(
    () =>
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      }),
    [navigation],
  );

  return (
    // On phones with notches, the insets.top value will be non-zero and we don't need additional padding on top.
    // On phones without notches, the insets.top value will be 0 and we don't want the header to be flush with the top of the screen.
    <View style={{width: '100%', backgroundColor: 'white', paddingTop: Math.max(8, insets.top)}}>
      <HStack justifyContent="space-between" pb={8} style={options.headerStyle} space={8} pl={3} pr={16}>
        {back ? (
          <AntDesign.Button
            size={24}
            color={colorLookup('text')}
            name="arrowleft"
            backgroundColor="white"
            iconStyle={{marginLeft: 0, marginRight: 0}}
            style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
            onPress={firstOpen ? reset : goBack}
          />
        ) : (
          <View width={42} />
        )}
        <TextComponent textAlign="center" style={{flex: 1, borderColor: 'transparent', borderWidth: 1}}>
          {shareParams.share_url ?? title}
        </TextComponent>
        <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'cover', flex: 0, flexGrow: 0}} avalancheCenterId={share ? shareCenterId : center_id} />
      </HStack>
    </View>
  );
};
