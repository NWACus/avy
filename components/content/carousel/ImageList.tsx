import React, {PropsWithChildren, useCallback, useState} from 'react';

import {FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent} from 'react-native';

import {View, VStack} from 'components/core';
import {MediaItem} from 'types/nationalAvalancheCenter';
import {HTML} from 'components/text/HTML';
import {NetworkImage, NetworkImageProps, NetworkImageState} from 'components/content/carousel/NetworkImage';

export interface ImageListProps extends Omit<FlatListProps<MediaItem>, 'data' | 'renderItem'> {
  imageHeight: number;
  imageWidth: number;
  media: MediaItem[];
  displayCaptions?: boolean;
  imageStyle?: NetworkImageProps['imageStyle'];
  onPress?: (index: number) => void;
  onScrollPositionChanged?: (index: number) => void;
}

export const ImageList: React.FunctionComponent<PropsWithChildren<ImageListProps>> = ({
  imageHeight,
  imageWidth,
  media,
  imageStyle,
  displayCaptions = true,
  onPress = () => undefined,
  onScrollPositionChanged = () => undefined,
  ...props
}) => {
  const padding = 16;

  // Loading state is used to force the FlatList to re-render when the image state changes.
  // Without this, the inputs to FlatList wouldn't change, and so it would never re-render individual list items.
  const [loadingState, setLoadingState] = useState<NetworkImageState[]>(media.map(() => 'loading'));

  const onPressCallback = useCallback(
    (index: number) => {
      console.log('onpress', media[index], index);
      onPress(index);
    },
    [media, onPress],
  );

  const renderItem = useCallback(
    ({item, index}) => (
      <VStack space={4} width={imageWidth + padding} alignItems="stretch" flex={1}>
        <NetworkImage
          width={imageWidth}
          height={imageHeight}
          uri={item.url.thumbnail}
          index={index}
          onPress={onPressCallback}
          imageStyle={imageStyle}
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
    [imageHeight, imageWidth, loadingState, displayCaptions, imageStyle, onPressCallback],
  );

  const onScroll = useCallback(
    ({
      nativeEvent: {
        contentOffset: {x},
      },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(x / (imageWidth + padding));
      onScrollPositionChanged(index);
    },
    [imageWidth, onScrollPositionChanged],
  );

  return (
    <FlatList
      horizontal
      data={media}
      extraData={loadingState}
      renderItem={renderItem}
      centerContent
      snapToInterval={imageWidth + padding}
      snapToAlignment="center"
      onScroll={onScroll}
      onMomentumScrollEnd={onScroll}
      {...props}
    />
  );
};
