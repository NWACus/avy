import Ionicons from '@expo/vector-icons/Ionicons';
import {Center, HStack, View, ViewProps} from 'components/core';
import {BodySm} from 'components/text';
import React from 'react';
import {GestureResponderEvent, TouchableOpacity} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';

interface MediaViewerModalHeaderProps {
  index: number;
  mediaCount: number;
  onClose: () => void;
}

const RoundButton = ({onPress, ...props}: {onPress: ((event: GestureResponderEvent) => void) | undefined} & ViewProps) => (
  <TouchableOpacity onPress={onPress}>
    <Center height={32} width={32} backgroundColor={colorLookup('modal.background')} borderRadius={16} {...props}>
      <Ionicons size={28} color="white" name="close-outline" />
    </Center>
  </TouchableOpacity>
);

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
