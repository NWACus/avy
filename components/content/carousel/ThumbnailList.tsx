import {NetworkImage, NetworkImageProps, NetworkImageState} from 'components/content/carousel/NetworkImage';
import {VStack, View} from 'components/core';
import React, {PropsWithChildren, useCallback, useMemo, useState} from 'react';
import {FlatList, FlatListProps} from 'react-native';
import {ImageMediaItem, MediaItem, MediaType, VideoMediaItem} from 'types/nationalAvalancheCenter';

export interface ThumbnailListItem {
  uri: string;
  isVideo: boolean;
  caption: string | null;
  title: string | null | undefined;
}

const thumbnailListItems = (mediaItems: MediaItem[]): ThumbnailListItem[] => {
  const thumbnailItems: ThumbnailListItem[] = [];

  mediaItems.forEach(item => {
    const isYouTubeVideo = item.type === MediaType.Video && typeof item.url !== 'string' && !('external_link' in item.url);
    if (isYouTubeVideo) {
      thumbnailItems.push(videoToThumbnailListItem(item));
    } else if (item.type === MediaType.Image) {
      thumbnailItems.push(imageToThumbnailListItem(item));
    }
  });

  return thumbnailItems;
};

export const videoToThumbnailListItem = (item: VideoMediaItem): ThumbnailListItem => {
  if (typeof item.url === 'string' || 'external_link' in item.url) {
    return {
      uri: '',
      isVideo: true,
      caption: item.caption,
      title: item.title,
    };
  }

  const url = item.url;
  return {
    uri: url['thumbnail'],
    isVideo: true,
    caption: item.caption,
    title: item.title,
  };
};

export const imageToThumbnailListItem = (item: ImageMediaItem): ThumbnailListItem => {
  return {
    uri: item.url['thumbnail'],
    isVideo: false,
    caption: item.caption,
    title: item.title,
  };
};

export interface ThumbnailListProps extends Omit<FlatListProps<ThumbnailListItem>, 'data' | 'renderItem'> {
  imageHeight: number;
  imageWidth: number;
  space?: number;
  mediaItems: MediaItem[];
  imageStyle?: NetworkImageProps['imageStyle'];
  resizeMode?: NetworkImageProps['resizeMode'];
  onPress?: (index: number) => void;
}

export const ThumbnailList: React.FC<PropsWithChildren<ThumbnailListProps>> = ({
  imageHeight,
  imageWidth,
  space = 16,
  mediaItems,
  imageStyle,
  resizeMode,
  onPress = () => undefined,
  ...props
}) => {
  const cellWidth = imageWidth + space;

  // Loading state is used to force the FlatList to re-render when the image state changes.
  // Without this, the inputs to FlatList wouldn't change, and so it would never re-render individual list items.
  const [loadingState, setLoadingState] = useState<NetworkImageState[]>(mediaItems.map(() => 'loading'));

  const onStateCallback = useCallback(
    (index: number, state: NetworkImageState) => {
      loadingState[index] = state;
      setLoadingState(loadingState);
    },
    [loadingState, setLoadingState],
  );

  const data = useMemo(() => thumbnailListItems(mediaItems), [mediaItems]);

  const renderItem = useCallback(
    ({item, index}: {item: ThumbnailListItem; index: number}) => (
      <VStack width={imageWidth} justifyContent="center" alignItems="center" flex={1} space={8}>
        <NetworkImage
          width={imageWidth}
          height={imageHeight}
          uri={item.uri}
          index={index}
          imageStyle={imageStyle}
          resizeMode={resizeMode}
          showVideoIndicator={item.isVideo}
          onStateChange={onStateCallback}
          onPress={onPress}
        />
      </VStack>
    ),
    [imageWidth, imageHeight, imageStyle, resizeMode, onPress, onStateCallback],
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
      data={data}
      extraData={loadingState}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparatorComponent}
      getItemLayout={getItemLayout}
      centerContent
      snapToInterval={imageWidth + space}
      snapToAlignment="center"
      {...props}
    />
  );
};
