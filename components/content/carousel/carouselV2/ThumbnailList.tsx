import {NetworkImage, NetworkImageProps, NetworkImageState} from 'components/content/carousel/NetworkImage';
import {View} from 'components/core';
import React, {PropsWithChildren, useCallback, useMemo, useState} from 'react';
import {FlatList, FlatListProps} from 'react-native';
import {ImageMediaItem, MediaItem, MediaType, VideoMediaItem} from 'types/nationalAvalancheCenter';

interface ThumbnailListItem {
  uri: string;
  isVideo: boolean;
  caption: string | null;
  title: string | null | undefined;
}

const thumbnailListItems = (mediaItems: MediaItem[]): ThumbnailListItem[] => {
  const supportedMedia = mediaItems.filter(item => {
    // We need to process video types to make sure we're only showing Youtube videos
    if (item.type === MediaType.Video) {
      if (typeof item.url === 'string' || 'external_link' in item.url) {
        return false;
      }

      return true;
    }

    return item.type === MediaType.Image;
  });

  const thumbnailItems = supportedMedia
    .map(item => {
      if (item.type === MediaType.Image) {
        return imageToThumbnailListItem(item);
      } else if (item.type === MediaType.Video) {
        return videoToThumbnailListItem(item);
      }
    })
    .filter(item => item !== undefined);

  return thumbnailItems;
};

const videoToThumbnailListItem = (item: VideoMediaItem): ThumbnailListItem => {
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

const imageToThumbnailListItem = (item: ImageMediaItem): ThumbnailListItem => {
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
  displayCaptions?: boolean;
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
      <View width={imageWidth} justifyContent="center" alignItems="center" flex={1}>
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
      </View>
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
