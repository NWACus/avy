import React, {PropsWithChildren, ReactElement, useCallback, useState} from 'react';

import {FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, ScrollView} from 'react-native';

import {NetworkImage, NetworkImageProps, NetworkImageState} from 'components/content/carousel/NetworkImage';
import {View, VStack} from 'components/core';
import {HTML} from 'components/text/HTML';
import {MediaItem} from 'types/nationalAvalancheCenter';

export interface ImageListProps extends Omit<FlatListProps<MediaItem>, 'data' | 'renderItem'> {
  imageHeight: number;
  imageWidth: number;
  space?: number;
  media: MediaItem[];
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

  const renderItem = useCallback(
    ({item, index}) => (
      <VStack space={8} width={imageWidth} alignItems="stretch" flex={1}>
        <NetworkImage
          width={imageWidth}
          height={imageHeight}
          uri={item.url[imageSize]}
          index={index}
          onPress={onPressCallback}
          imageStyle={imageStyle}
          resizeMode={resizeMode}
          onStateChange={state => {
            loadingState[index] = state;
            setLoadingState(loadingState);
          }}
        />
        {displayCaptions && (
          <View flex={1} px={32}>
            <ScrollView bounces={false}>
              <HTML source={{html: item.caption}} />
            </ScrollView>
          </View>
        )}
        {renderOverlay?.(index)}
      </VStack>
    ),
    [imageHeight, imageWidth, loadingState, displayCaptions, imageSize, imageStyle, resizeMode, onPressCallback, renderOverlay],
  );

  const onScroll = useCallback(
    ({
      nativeEvent: {
        contentOffset: {x},
      },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(x / cellWidth);
      onScrollPositionChanged(index);
    },
    [cellWidth, onScrollPositionChanged],
  );

  return (
    <FlatList
      horizontal
      data={media}
      extraData={loadingState}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View width={space} />}
      getItemLayout={(_data, index) => ({length: cellWidth, offset: cellWidth * index, index})}
      centerContent
      snapToInterval={imageWidth + space}
      snapToAlignment="center"
      onScroll={onScroll}
      onMomentumScrollEnd={onScroll}
      {...props}
    />
  );
};
