import React, {PropsWithChildren, useEffect, useState} from 'react';

import {Modal} from 'react-native';

import {AntDesign} from '@expo/vector-icons';

import {Center, HStack, View, ViewProps, VStack} from 'components/core';
import {MediaItem} from 'types/nationalAvalancheCenter';
import {BodySm} from 'components/text';
import {HTMLRendererConfig} from 'components/text/HTML';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {ImageList} from 'components/content/carousel/ImageList';

export interface ImageViewerModalProps extends ViewProps {
  visible: boolean;
  media: MediaItem[];
  startIndex: number;
  onClose: () => void;
}

const htmlStyle = {fontSize: 12, textAlign: 'center', color: 'white'} as const;

export const ImageViewerModal: React.FunctionComponent<PropsWithChildren<ImageViewerModalProps>> = ({visible, media, startIndex, onClose, ..._props}) => {
  // TODO: take start index and use a ref to tell the scrollview to move to it
  const [index, setIndex] = useState<number>(startIndex);
  useEffect(() => setIndex(startIndex), [startIndex]);

  return (
    // onRequestClose handles the back button on Android - there's also an explicit close button in this modal
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent={false}>
      <SafeAreaProvider>
        <SafeAreaView style={{backgroundColor: '#333333'}}>
          <VStack height="100%" width="100%" justifyContent="space-between" pb={16} space={16}>
            <HStack width="100%" justifyContent="space-between" alignItems="center" height={64}>
              <View width={64} height={64} />
              <Center>
                <BodySm color="white">
                  {index + 1} / {media.length}
                </BodySm>
              </Center>
              <AntDesign.Button
                size={32}
                color="white"
                name="close"
                backgroundColor="#333333"
                iconStyle={{marginRight: 0}}
                style={{textAlign: 'center', paddingRight: 8}}
                onPress={onClose}
              />
            </HStack>
            <View flex={1} justifyContent="center" borderColor={'red'} borderWidth={2}>
              <HTMLRendererConfig baseStyle={htmlStyle}>
                <ImageList
                  imageWidth={428}
                  imageHeight={(428 * 4) / 3.0}
                  media={media}
                  displayCaptions={true}
                  imageStyle={{borderRadius: 0, borderWidth: 0}}
                  onScrollPositionChanged={setIndex}
                  disableIntervalMomentum
                />
              </HTMLRendererConfig>
            </View>
          </VStack>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};
