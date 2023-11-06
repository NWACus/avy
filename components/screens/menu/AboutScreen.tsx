import React, {useCallback, useState} from 'react';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Platform, StyleSheet} from 'react-native';

import * as Application from 'expo-application';
import * as Clipboard from 'expo-clipboard';
import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';

import {Ionicons} from '@expo/vector-icons';

import {ActionList} from 'components/content/ActionList';
import {Center, HStack, View, VStack} from 'components/core';
import {Body, BodyBlack, BodyXSm, Title3Black} from 'components/text';
import {getUpdateGroupId, getUpdateTimeAsVersionString} from 'hooks/useEASUpdateStatus';
import {MenuStackParamList} from 'routes';

export const AboutScreen = (_: NativeStackScreenProps<MenuStackParamList, 'about'>) => {
  const [updateGroupId] = useState(getUpdateGroupId());
  const openUrl = useCallback(({data}: {data: string}) => void WebBrowser.openBrowserAsync(data), []);
  const copyVersionInfoToClipboard = useCallback(() => {
    void (async () => {
      await Clipboard.setStringAsync(
        `Avy version ${Application.nativeApplicationVersion || 'n/a'} (${Application.nativeBuildVersion || 'n/a'})
Build date ${getUpdateTimeAsVersionString()}
Git revision ${process.env.EXPO_PUBLIC_GIT_REVISION || 'n/a'}
Update group ID ${updateGroupId} (channel: ${Updates.channel || 'development'})
Update ID ${Updates.updateId || 'n/a'} (platform: ${Platform.OS})`,
      );
    })();
  }, [updateGroupId]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <VStack backgroundColor="white" width="100%" height="100%" pt={16} justifyContent="space-between">
        <VStack space={16}>
          <Center>
            <Title3Black>About Avy</Title3Black>
          </Center>
          <View px={32}>
            <Body>
              The Northwest Avalanche Center developed the Avy app to support wintertime mountain recreation with streamlined avalanche and weather information from avalanche
              centers across the U.S. In winter 2023/24, the app offers access to the Northwest Avalanche Center and the Sawtooth Avalanche Center with planned expansion in
              subsequent years.
            </Body>
          </View>

          <ActionList
            header={<BodyBlack>Legal</BodyBlack>}
            pl={32}
            actions={[
              {label: 'Terms of Use', data: 'https://nwac.us/terms-of-use/', action: openUrl},
              {label: 'Privacy Policy', data: 'https://nwac.us/privacy-policy/', action: openUrl},
            ]}
          />
        </VStack>
        <HStack space={4} px={32}>
          <VStack py={8} space={4}>
            <BodyXSm>
              Avy version {Application.nativeApplicationVersion} ({Application.nativeBuildVersion}) | {getUpdateTimeAsVersionString()} |{' '}
              {(process.env.EXPO_PUBLIC_GIT_REVISION || 'n/a').slice(0, 7)}
            </BodyXSm>
            {updateGroupId && (
              <BodyXSm>
                Update: {updateGroupId} ({Updates.channel || 'development'})
              </BodyXSm>
            )}
          </VStack>
          <Ionicons.Button name="copy-outline" size={12} color="black" style={{backgroundColor: 'white'}} iconStyle={{marginRight: 0}} onPress={copyVersionInfoToClipboard} />
        </HStack>
      </VStack>
    </View>
  );
};
