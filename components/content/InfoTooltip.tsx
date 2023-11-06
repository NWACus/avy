import {AntDesign} from '@expo/vector-icons';
import {Button} from 'components/content/Button';
import {Center, View, VStack} from 'components/core';
import {BodyBlack, Title3Semibold} from 'components/text';
import {HTML, HTMLRendererConfig, HTMLRendererConfigProps} from 'components/text/HTML';
import {merge} from 'lodash';
import React, {useCallback, useMemo, useState} from 'react';
import {ColorValue, Insets, Modal, TextStyle, TouchableWithoutFeedback, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';

export interface InfoTooltipProps {
  title: string;
  content: string;
  size: number;
  color?: ColorValue;
  solidIcon?: keyof typeof AntDesign.glyphMap;
  outlineIcon?: keyof typeof AntDesign.glyphMap;

  htmlStyle?: HTMLRendererConfigProps['baseStyle'];
  // Additional IconButton customization
  style?: ViewStyle | TextStyle;
  hitSlop?: Insets | undefined;
}

const baseHtmlStyle = {fontSize: 14, lineHeight: 21, textAlign: 'center'} as const;

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  content,
  color = 'text',
  solidIcon = 'infocirlce', // unfortunate ant misspelling: infocirlce
  outlineIcon = 'infocirlceo', // another unfortunate ant misspelling: infocirlceo
  size,
  htmlStyle = {},
  ...props
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const openModal = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const finalHtmlStyle = useMemo(() => merge({}, baseHtmlStyle, htmlStyle), [htmlStyle]);

  return (
    <>
      {/* unfortunate ant misspelling: infocirlceo */}
      <AntDesign.Button name={outlineIcon} color={colorLookup(color)} backgroundColor="transparent" onPress={openModal} size={size} iconStyle={{marginRight: 0}} {...props} />
      {/* Pressing the Android back button dismisses the modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        {/* Pressing anywhere outside the modal dismisses the modal */}
        <TouchableWithoutFeedback onPress={closeModal}>
          <View position="absolute" top={0} bottom={0} left={0} right={0} backgroundColor={'rgba(0, 0, 0, 0.55)'}>
            <SafeAreaView>
              <Center width="100%" height="100%">
                <VStack
                  alignItems="stretch"
                  bg="white"
                  borderRadius={16}
                  px={12}
                  py={24}
                  m={12}
                  space={8}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,

                    elevation: 5,
                  }}>
                  <AntDesign name={solidIcon} color={colorLookup('primary')} size={30} style={{alignSelf: 'center', marginBottom: 4}} />
                  <Title3Semibold textAlign="center">{title}</Title3Semibold>
                  <HTMLRendererConfig baseStyle={finalHtmlStyle}>
                    <HTML source={{html: content}} />
                  </HTMLRendererConfig>
                  <Button onPress={closeModal}>
                    <BodyBlack>Close</BodyBlack>
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
