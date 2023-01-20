import {AntDesign} from '@expo/vector-icons';
import {Button} from 'components/content/Button';
import {Center, View, VStack} from 'components/core';
import {Body, Title3Semibold} from 'components/text';
import {HTML, HTMLRendererConfig} from 'components/text/HTML';
import React, {useCallback, useState} from 'react';
import {ColorValue, Modal, TouchableWithoutFeedback} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';

export interface InfoTooltipProps {
  title: string;
  content: string;
  color?: ColorValue;
  size: number;
}

const htmlStyle = {fontSize: 14, lineHeight: 21, textAlign: 'center'} as const;

export const InfoTooltip: React.FC<InfoTooltipProps> = ({title, content, color = 'darktext', size}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const openModal = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  return (
    <>
      {/* unfortunate ant misspelling: infocirlceo */}
      <AntDesign.Button name="infocirlceo" color={colorLookup(color)} backgroundColor="rgba(1, 1, 1, 0)" onPress={openModal} size={size} iconStyle={{marginRight: 0}} />
      {/* Pressing the Android back button dismisses the modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        {/* Pressing anywhere outside the modal dismisses the modal */}
        <TouchableWithoutFeedback onPress={closeModal}>
          <View position="absolute" top={0} bottom={0} left={0} right={0} bg="rgba(1, 0, 1, 0.2)">
            <SafeAreaView>
              <Center width="100%" height="100%">
                <VStack alignItems="center" bg="white" borderRadius={16} px={12} py={24} m={12} space={8}>
                  {/* unfortunate ant misspelling: infocirlce */}
                  <AntDesign name="infocirlce" color={colorLookup('color-primary')} size={30} />
                  <Title3Semibold>{title}</Title3Semibold>
                  <HTMLRendererConfig baseStyle={htmlStyle}>
                    <HTML source={{html: content}} />
                  </HTMLRendererConfig>
                  <Button onPress={closeModal} alignSelf="stretch">
                    <Body>Close</Body>
                  </Button>
                </VStack>
              </Center>
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
