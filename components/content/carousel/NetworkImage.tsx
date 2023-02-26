import React from 'react';

import {merge} from 'lodash';

import {ActivityIndicator, Image, ImageStyle, StyleProp, TouchableOpacity} from 'react-native';

import {FontAwesome5} from '@expo/vector-icons';

import {Center, VStack} from 'components/core';
import {Body} from 'components/text';
import {useCachedImageURI} from 'hooks/useCachedImageURI';
import {colorLookup, COLORS} from 'theme/colors';

export type NetworkImageState = 'loading' | 'success' | 'error';

export interface NetworkImageProps {
  uri: string;
  width: number;
  height: number;
  index: number;
  onStateChange: (state: NetworkImageState) => void;
  onPress: (index: number) => void;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
}

const defaultImageStyle = {borderRadius: 16, borderColor: colorLookup('light.300'), borderWidth: 1};

export const NetworkImage: React.FC<NetworkImageProps> = ({uri, width, height, onStateChange, index, onPress, imageStyle: imageStyleProp, resizeMode = 'cover'}) => {
  const {status, data: cachedUri} = useCachedImageURI(uri);

  React.useEffect(() => {
    onStateChange(status);
  }, [onStateChange, status]);

  const imageStyle = {};
  merge(imageStyle, defaultImageStyle, imageStyleProp ?? {});

  // With this style, the available space is always completely filled. portrait and panoramic images are cropped to fit the available space.
  const croppedThumbnailProps = {
    style: {
      width,
      height,
      flex: 1,
      ...imageStyle,
    },
    resizeMode,
  } as const;

  return (
    <Center width={width} height={height}>
      {status === 'loading' && <ActivityIndicator style={{height: Math.min(32, height / 2)}} />}
      {status === 'error' && (
        <VStack space={8} alignItems="center">
          <FontAwesome5 name="exclamation-triangle" size={Math.min(32, height / 2)} color={COLORS['warning.700']} />
          <Body>Media failed to load.</Body>
        </VStack>
      )}
      {(status === 'success' || status === 'loading') && (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(index)} disabled={status !== 'success'}>
          <Image source={{uri: cachedUri}} {...croppedThumbnailProps} />
        </TouchableOpacity>
      )}
    </Center>
  );
};
