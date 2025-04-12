import React, { PropsWithChildren, useCallback } from 'react';

import { GestureResponderEvent, ScrollView, TouchableOpacity } from 'react-native';

import ImageView from 'react-native-image-viewing';

import { AntDesign } from '@expo/vector-icons';
import { Center, HStack, View, ViewProps } from 'components/core';
import { BodySm } from 'components/text';
import { HTML, HTMLRendererConfig } from 'components/text/HTML';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colorLookup } from 'theme';
import { ImageMediaItem } from 'types/nationalAvalancheCenter';

export interface ImageViewerModalProps extends ViewProps {
  visible: boolean;
  media: ImageMediaItem[];
  startIndex: number;
  onClose: () => void;
}

const htmlStyle = { fontSize: 12, textAlign: 'center', color: 'white' } as const;

export const RoundButton = ({ onPress, ...props }: { onPress: ((event: GestureResponderEvent) => void) | undefined } & ViewProps) => (
  <TouchableOpacity onPress={onPress}>
    <Center height={32} width={32} backgroundColor={colorLookup('modal.background')} borderRadius={16} {...props}>
      <AntDesign size={24} color="white" name="close" />
    </Center>
  </TouchableOpacity>
);

export const ImageViewerModal: React.FunctionComponent<PropsWithChildren<ImageViewerModalProps>> = ({ visible, media, startIndex, onClose, ..._props }) => {
  const HeaderComponent = useCallback(
    ({ imageIndex }: { imageIndex: number }) => (
      <SafeAreaProvider>
        <SafeAreaView>
          <HStack width="100%" justifyContent="space-between" alignItems="center" height={64}>
            <View width={64} height={64} />
            <Center>
              <BodySm color="white">
                {imageIndex + 1} / {media.length}
              </BodySm>
            </Center>
            <RoundButton onPress={onClose} marginRight={16} />
          </HStack>
        </SafeAreaView>
      </SafeAreaProvider>
    ),
    [media.length, onClose],
  );
  const FooterComponent = useCallback(
    ({ imageIndex }: { imageIndex: number }) => (
      <View flex={1} px={32} pb={16}>
        <ScrollView bounces={false}>{media[imageIndex].caption && <HTML source={{ html: media[imageIndex].caption ?? '' }} />}</ScrollView>
      </View>
    ),
    [media],
  );
  const keyExtractor = useCallback((_imageSrc: unknown, index: number) => index.toString(), []);

  return (
    // onRequestClose handles the back button on Android - there's also an explicit close button in this modal
    <HTMLRendererConfig baseStyle={htmlStyle}>
      <ImageView
        images={media.map(m => ({ uri: m.url.original }))}
        keyExtractor={keyExtractor}
        imageIndex={startIndex}
        visible={visible}
        swipeToCloseEnabled
        backgroundColor={colorLookup('modal.background').toString()}
        onRequestClose={onClose}
        HeaderComponent={HeaderComponent}
        FooterComponent={FooterComponent}
      />
    </HTMLRendererConfig>
  );
};
