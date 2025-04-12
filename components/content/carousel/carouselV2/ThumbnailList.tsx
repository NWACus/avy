import React, { PropsWithChildren, ReactElement, useCallback, useState } from 'react';

import { FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

import { NetworkImage, NetworkImageProps, NetworkImageState } from 'components/content/carousel/NetworkImage';
import { VStack, View } from 'components/core';
import { HTML } from 'components/text/HTML';
import { ImageMediaItem, MediaType } from 'types/nationalAvalancheCenter';

export interface ImageListProps extends Omit<FlatListProps<ImageMediaItem>, 'data' | 'renderItem'> {
  imageHeight: number;
  imageWidth: number;
  space?: number;
  media: ImageMediaItem[];
  imageSize?: 'large' | 'medium' | 'original' | 'thumbnail';
  displayCaptions?: boolean;
  imageStyle?: NetworkImageProps['imageStyle'];
  resizeMode?: NetworkImageProps['resizeMode'];
  onPress?: (index: number) => void;
  onScrollPositionChanged?: (index: number) => void;
  renderOverlay?: (index: number) => ReactElement;
}

export const ImageList: React.FC<PropsWithChildren<ImageListProps>> = ({
  imageHeight,
  imageWidth,
  space = 16,
  media,
  imageSize = 'thumbnail',
  imageStyle,
  resizeMode,
  displayCaptions = true,
  onPress = () => undefined,
  onScrollPositionChanged = () => undefined,
  renderOverlay,
  ...props
}) => {
  const cellWidth = imageWidth + space;

  // Loading state is used to force the FlatList to re-render when the image state changes.
  // Without this, the inputs to FlatList wouldn't change, and so it would never re-render individual list items.
  const [loadingState, setLoadingState] = useState<NetworkImageState[]>(media.map(() => 'loading'));

  const onPressCallback = useCallback((index: number) => onPress(index), [onPress]);
  const onStateCallback = useCallback(
    (index: number, state: NetworkImageState) => {
      loadingState[index] = state;
      setLoadingState(loadingState);
    },
    [loadingState, setLoadingState],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ImageMediaItem; index: number }) => (
      <VStack space={8} width={imageWidth} alignItems="stretch" flex={1}>
        <NetworkImage
          width={imageWidth}
          height={imageHeight}
          uri={item.url[imageSize]}
          index={index}
          onPress={onPressCallback}
          imageStyle={imageStyle}
          resizeMode={resizeMode}
          onStateChange={onStateCallback}
        />
        {displayCaptions && item.caption && (
          <View flex={1} px={32}>
            <ScrollView bounces={false}>
              <HTML source={{ html: item.caption }} />
            </ScrollView>
          </View>
        )}
        {renderOverlay?.(index)}
      </VStack>
    ),
    [imageWidth, imageHeight, imageSize, onPressCallback, imageStyle, resizeMode, onStateCallback, displayCaptions, renderOverlay],
  );

  const onScroll = useCallback(
    ({
      nativeEvent: {
        contentOffset: { x },
      },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(x / cellWidth);
      onScrollPositionChanged(index);
    },
    [cellWidth, onScrollPositionChanged],
  );
  const ItemSeparatorComponent = useCallback(() => <View width={space} />, [space]);
  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: cellWidth,
      offset: cellWidth * index,
      index,
    }),
    [cellWidth],
  );

  return (
    <FlatList
      horizontal
      data={media.filter(item => item.type === MediaType.Image).filter(item => item.url)}
      extraData={loadingState}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparatorComponent}
      getItemLayout={getItemLayout}
      centerContent
      snapToInterval={imageWidth + space}
      snapToAlignment="center"
      onScroll={onScroll}
      onMomentumScrollEnd={onScroll}
      {...props}
    />
  );
};
