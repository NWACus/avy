import React, {useState} from 'react';

import {merge} from 'lodash';

import {ActivityIndicator, Image, ImageStyle, StyleProp, TouchableOpacity} from 'react-native';

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
  imageStyle?: StyleProp<ImageStyle>;
}

const defaultImageStyle = {borderRadius: 16, borderColor: colorLookup('light.200'), borderWidth: 1};

export const NetworkImage: React.FC<NetworkImageProps> = ({uri, width, height, onStateChange, index, onPress, imageStyle: imageStyleProp}) => {
  const [state, setState] = useState<NetworkImageState>('loading');
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
    resizeMode: 'cover',
  } as const;

  return (
    <Center width={width} height={height}>
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
            onLoad={() => {
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
