import Ionicons from '@expo/vector-icons/Ionicons';
import {BottomTabHeaderProps} from '@react-navigation/bottom-tabs';
import {DrawerActions} from '@react-navigation/native';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, View} from 'components/core';
import {Title3Black} from 'components/text';
import React, {useCallback} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface BottomTabNavigationHeader extends BottomTabHeaderProps {
  centerId: AvalancheCenterID;
}

export const BottomTabNavigationHeader: React.FunctionComponent<BottomTabNavigationHeader> = ({navigation, centerId}) => {
  const title = centerId as string;
  const TextComponent = Title3Black;
  const insets = useSafeAreaInsets();

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  return (
    <View style={{width: '100%', backgroundColor: colorLookup('white'), paddingTop: insets.top, justifyContent: 'center', alignContent: 'center'}}>
      <HStack justifyContent="space-between" space={8} pl={3} pr={16}>
        <Ionicons.Button
          size={24}
          color={colorLookup('primary')}
          name="menu"
          backgroundColor={colorLookup('white')}
          iconStyle={{marginLeft: 0, marginRight: 0}}
          style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
          onPress={openDrawer}
        />

        <HStack space={4}>
          <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain'}} avalancheCenterId={centerId} />
          <TextComponent textAlign="center" style={{borderColor: 'transparent', borderWidth: 1, color: colorLookup('text')}}>
            {title}
          </TextComponent>
        </HStack>

        <View width={24} />
      </HStack>
    </View>
  );
};
