import React, {useCallback} from 'react';
import {Image, Modal} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import {Button} from 'components/content/Button';
import {HStack, View, VStack} from 'components/core';
import {Body, BodyBlack, Title3Black} from 'components/text';
import {colorLookup} from 'theme';

interface FirstRunExperienceModalProps {
  visible: boolean;
  onClose: () => void;
}

const BulletItem: React.FC<{children: React.ReactNode}> = ({children}) => (
  <HStack space={8} alignItems="flex-start">
    <Body>{'\u2022'}</Body>
    <Body style={{flex: 1}}>{children}</Body>
  </HStack>
);

export const FirstRunExperienceModal: React.FC<FirstRunExperienceModalProps> = ({visible, onClose}) => {
  const onPressOkay = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24}}>
        <View style={{backgroundColor: colorLookup('white'), borderRadius: 16, padding: 24, width: '100%', maxWidth: 340}}>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports*/}
          <Image source={require('assets/avy-logo-transparent.png')} resizeMode="contain" style={{height: 90, width: '100%', alignSelf: 'center', paddingBottom: 12}} />
          <VStack space={12}>
            <Title3Black textAlign="center">Avy has a fresh look!</Title3Black>
            <Body textAlign="left">{'We’ve redesigned the map to make it faster and easier to access avalanche forecasts from across the country.'}</Body>
            <VStack space={8}>
              <BulletItem>
                Switch <BodyBlack letterSpacing={0}>Centers</BodyBlack> right from the map! Simply zoom out and tap on a <BodyBlack letterSpacing={0}>Zone</BodyBlack> from a
                different <BodyBlack letterSpacing={0}>Center</BodyBlack>.
              </BulletItem>
              <BulletItem>
                You can still switch <BodyBlack letterSpacing={0}>Centers</BodyBlack> in the settings, accessible in the upper left{' '}
                <BodyBlack letterSpacing={0}>
                  Menu
                  <Ionicons color={colorLookup('primary')} name="menu" backgroundColor={colorLookup('white')} size={12} />
                </BodyBlack>
              </BulletItem>
            </VStack>
          </VStack>
          <View mt={16} alignItems="stretch">
            <Button buttonStyle="primary" onPress={onPressOkay}>
              <BodyBlack>Okay</BodyBlack>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
