import {MediaViewerModal} from 'components/content/carousel/carouselV2/MediaViewerModal/MediaViewerModal';
import {ThumbnailList} from 'components/content/carousel/carouselV2/ThumbnailList';
import {View, ViewProps} from 'components/core';
import React, {PropsWithChildren, useCallback, useState} from 'react';
import {MediaItem} from 'types/nationalAvalancheCenter';

export interface MediaCarouselProps extends ViewProps {
  thumbnailHeight: number;
  thumbnailAspectRatio?: number;
  mediaItems: MediaItem[];
  displayCaptions?: boolean;
}

export const MediaCoursel: React.FunctionComponent<PropsWithChildren<MediaCarouselProps>> = ({
  thumbnailHeight,
  thumbnailAspectRatio = 1.3,
  mediaItems,
  displayCaptions = true,
  ...props
}) => {
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
      <ThumbnailList
        imageWidth={thumbnailWidth}
        imageHeight={thumbnailHeight}
        mediaItems={mediaItems}
        displayCaptions={displayCaptions}
        onPress={onPress}
        imageStyle={{borderRadius: 4}}
      />
      <MediaViewerModal visible={modalIndex !== null} startIndex={modalIndex ?? 0} mediaItems={mediaItems} onClose={onClose} />
    </View>
  );
};
