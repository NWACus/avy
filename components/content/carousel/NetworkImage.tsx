import React, {useState} from 'react';

import {ActivityIndicator, Image, ImageProps, TouchableOpacity} from 'react-native';

import {FontAwesome5} from '@expo/vector-icons';

import {Center, VStack} from 'components/core';
import {Body} from 'components/text';
import {colorLookup, COLORS} from 'theme/colors';

export type NetworkImageState = 'loading' | 'ready' | 'error';

export interface NetworkImageProps {
  uri: string;
  width: number;
  height: number;
  index: number;
  onStateChange: (state: NetworkImageState) => void;
  onPress: (index: number) => void;
  borderRadius?: number;
  imageStyle?: ImageProps['style'];
}

export const NetworkImage: React.FC<NetworkImageProps> = ({uri, width, height, onStateChange, index, onPress, borderRadius = 16, imageStyle}) => {
  const [state, setState] = useState<NetworkImageState>('loading');
  const [imageSize, setImageSize] = useState([0, 0]);

  // With this style, the available space is always completely filled. a portrait image is cropped to fit the available space.
  const croppedThumbnailProps = {
    style: {
      width,
      height,
      flex: 1,
      borderRadius: borderRadius,
      ...(typeof imageStyle === 'object' ? imageStyle : {}),
    },
    resizeMode: 'cover',
  } as const;

  // With this style, the full thumbnail is always visible. a portrait image will leave whitespace on the sides.
  // Note: this style still needs work for panoramic images, it allows bleeding beyond the right edge.
  const _fullThumbnailProps = {
    style: {
      width: imageSize[0] === 0 ? undefined : imageSize[0],
      height: imageSize[1] === 0 ? undefined : imageSize[1],
      aspectRatio: imageSize[1] > 0 ? imageSize[0] / imageSize[1] : 1,
      flex: 1,
      borderRadius: imageSize[1] > imageSize[0] ? 0 : borderRadius, // don't round the corners of a vertical image
    },
    resizeMode: 'contain',
  } as const;

  return (
    <Center width={width} height={height} borderColor={colorLookup('light.200')} borderWidth={1} borderRadius={borderRadius}>
      {state === 'loading' && <ActivityIndicator style={{height: Math.min(32, height / 2)}} />}
      {state === 'error' && (
        <VStack space={8} alignItems="center">
          <FontAwesome5 name="exclamation-triangle" size={Math.min(32, height / 2)} color={COLORS['warning.700']} />
          <Body>Media failed to load.</Body>
        </VStack>
      )}
      {(state === 'ready' || state === 'loading') && (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(index)} disabled={state !== 'ready'}>
          <Image
            source={{uri}}
            onLoad={({
              nativeEvent: {
                source: {width, height},
              },
            }) => {
              setImageSize([width, height]);
              setState('ready');
              onStateChange('ready');
            }}
            onError={_e => setState('error')}
            {...croppedThumbnailProps}
          />
        </TouchableOpacity>
      )}
    </Center>
  );
};
