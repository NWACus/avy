import {MediaViewerModal} from 'components/content/carousel/MediaViewerModal/MediaViewerModal';
import {ThumbnailList} from 'components/content/carousel/ThumbnailList';
import {View, ViewProps} from 'components/core';
import React, {PropsWithChildren, useCallback, useState} from 'react';
import {ImageMediaItem, MediaItem, MediaType} from 'types/nationalAvalancheCenter';

export const images = (media: MediaItem[] | null | undefined): ImageMediaItem[] => {
  const filtered: ImageMediaItem[] = [];
  if (!media) {
    return filtered;
  }
  for (const item of media) {
    if (item.type === MediaType.Image) {
      filtered.push(item);
    }
  }
  return filtered;
};

export interface MediaCarouselProps extends ViewProps {
  thumbnailHeight: number;
  thumbnailAspectRatio?: number;
  mediaItems: MediaItem[];
}

export const MediaCarousel: React.FunctionComponent<PropsWithChildren<MediaCarouselProps>> = ({thumbnailHeight, thumbnailAspectRatio = 1.3, mediaItems, ...props}) => {
  const thumbnailWidth = thumbnailAspectRatio * thumbnailHeight;

  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const onPress = useCallback(
    (index: number) => {
      setModalIndex(index);
    },
    [setModalIndex],
  );

  const onClose = useCallback(() => setModalIndex(null), [setModalIndex]);

  return (
    <View {...props}>
      <ThumbnailList imageWidth={thumbnailWidth} imageHeight={thumbnailHeight} mediaItems={mediaItems} onPress={onPress} imageStyle={{borderRadius: 4}} />
      <MediaViewerModal visible={modalIndex !== null} startIndex={modalIndex ?? 0} mediaItems={mediaItems} onClose={onClose} />
    </View>
  );
};
