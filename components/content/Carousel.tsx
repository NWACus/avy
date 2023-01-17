import React, {PropsWithChildren, useCallback, useState} from 'react';

import {ActivityIndicator, FlatList, Image, ImageProps} from 'react-native';

import {FontAwesome5} from '@expo/vector-icons';

import {Center, View, ViewProps, VStack} from 'components/core';
import {MediaItem} from 'types/nationalAvalancheCenter';
import {Body} from 'components/text';
import {HTML, HTMLRendererConfig} from 'components/text/HTML';
import {colorLookup, COLORS} from 'theme/colors';

type NetworkImageState = 'loading' | 'ready' | 'error';

interface NetworkImageProps {
  uri: string;
  width: number;
  height: number;
  onStateChange: (state: NetworkImageState) => void;
  borderRadius?: number;
  imageStyle?: ImageProps['style'];
}

const NetworkImage: React.FC<NetworkImageProps> = ({uri, width, height, onStateChange, borderRadius = 16, imageStyle}) => {
  const [state, setState] = useState<NetworkImageState>('loading');
  const [imageSize, setImageSize] = useState([0, 0]);

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
          style={{
            width: imageSize[0] === 0 ? undefined : imageSize[0],
            height: imageSize[1] === 0 ? undefined : imageSize[1],
            aspectRatio: imageSize[1] > 0 ? imageSize[0] / imageSize[1] : 1,
            flex: 1,
            borderRadius: imageSize[1] > imageSize[0] ? 0 : borderRadius, // don't round the corners of a vertical image
            ...(typeof imageStyle === 'object' ? imageStyle : {}),
          }}
          resizeMode="cover"
        />
      )}
    </Center>
  );
};

export interface CarouselProps extends ViewProps {
  thumbnailHeight: number;
  media: MediaItem[];
  displayCaptions?: boolean;
}

export const Carousel: React.FunctionComponent<PropsWithChildren<CarouselProps>> = ({thumbnailHeight, media, displayCaptions = true, ...props}) => {
  const thumbnailWidth = 1.3 * thumbnailHeight;
  const padding = 16;

  // Loading state is used to force the FlatList to re-render when the image state changes.
  // Without this, the inputs to FlatList wouldn't change, and so it would never re-render individual list items.
  const [loadingState, setLoadingState] = useState<NetworkImageState[]>(media.map(() => 'loading'));

  const renderItem = useCallback(
    ({item, index}) => (
      <VStack space={4} width={thumbnailWidth + padding} alignItems="stretch" flex={1}>
        <NetworkImage
          width={thumbnailWidth}
          height={thumbnailHeight}
          uri={item.url.thumbnail}
          onStateChange={state => {
            loadingState[index] = state;
            setLoadingState(loadingState);
          }}
        />
        {displayCaptions && (
          <View flex={1} px={32}>
            <HTML source={{html: item.caption}} />
          </View>
        )}
      </VStack>
    ),
    [thumbnailHeight, thumbnailWidth, loadingState, displayCaptions],
  );

  return (
    <HTMLRendererConfig baseStyle={{fontSize: 12, fontFamily: 'Lato_400Regular_Italic', textAlign: 'center'}}>
      <FlatList
        horizontal
        data={media}
        extraData={loadingState}
        renderItem={renderItem}
        centerContent
        snapToInterval={thumbnailWidth + padding}
        snapToAlignment="center"
        {...props}
      />
    </HTMLRendererConfig>
  );
};
