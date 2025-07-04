import {RoundButton} from 'components/content/carousel/ImageViewerModal';
import {Center, HStack, View} from 'components/core';
import {BodySm} from 'components/text';
import React from 'react';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

interface MediaViewerModalHeaderProps {
  index: number;
  mediaCount: number;
  onClose: () => void;
}

export const MediaViewerModalHeader: React.FunctionComponent<MediaViewerModalHeaderProps> = ({index, mediaCount, onClose}) => {
  return (
    <View style={{position: 'absolute', zIndex: 1, top: 0, width: '100%'}}>
      <SafeAreaProvider>
        <SafeAreaView>
          <HStack width="100%" justifyContent="space-between" alignItems="center" height={64}>
            <View width={64} height={64} />
            <Center>
              <BodySm color="white">
                {index + 1} / {mediaCount}
              </BodySm>
            </Center>
            <RoundButton onPress={onClose} marginRight={16} />
          </HStack>
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  );
};
