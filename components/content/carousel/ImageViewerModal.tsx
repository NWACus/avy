import React, {PropsWithChildren} from 'react';

import {ScrollView, TouchableOpacity} from 'react-native';

import ImageView from 'react-native-image-viewing';

import {AntDesign} from '@expo/vector-icons';
import {Center, HStack, View, ViewProps} from 'components/core';
import {BodySm} from 'components/text';
import {HTML, HTMLRendererConfig} from 'components/text/HTML';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {MediaItem} from 'types/nationalAvalancheCenter';

export interface ImageViewerModalProps extends ViewProps {
  visible: boolean;
  media: MediaItem[];
  startIndex: number;
  onClose: () => void;
}

const htmlStyle = {fontSize: 12, textAlign: 'center', color: 'white'} as const;

const RoundButton = ({onPress, ...props}) => (
  <TouchableOpacity onPress={onPress}>
    <Center height={32} width={32} backgroundColor="#333333" borderRadius={16} {...props}>
      <AntDesign size={24} color="white" name="close" />
    </Center>
  </TouchableOpacity>
);

export const ImageViewerModal: React.FunctionComponent<PropsWithChildren<ImageViewerModalProps>> = ({visible, media, startIndex, onClose, ..._props}) => {
  const HeaderComponent = ({imageIndex}) => (
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
  );
  const FooterComponent = ({imageIndex}) => (
    <View flex={1} px={32} pb={16}>
      <ScrollView bounces={false}>
        <HTML source={{html: media[imageIndex].caption}} />
      </ScrollView>
    </View>
  );

  return (
    // onRequestClose handles the back button on Android - there's also an explicit close button in this modal
    <HTMLRendererConfig baseStyle={htmlStyle}>
      <ImageView
        images={media.map(m => ({uri: m.url.original}))}
        keyExtractor={(_imageSrc, index) => index.toString()}
        imageIndex={startIndex}
        visible={visible}
        swipeToCloseEnabled
        backgroundColor="#333333"
        onRequestClose={onClose}
        HeaderComponent={HeaderComponent}
        FooterComponent={FooterComponent}
      />
    </HTMLRendererConfig>
  );
};
