import React, {PropsWithChildren, useCallback, useState} from 'react';

import {ImageList} from 'components/content/carousel/ImageList';
import {ImageViewerModal} from 'components/content/carousel/ImageViewerModal';
import {View, ViewProps} from 'components/core';
import {HTMLRendererConfig} from 'components/text/HTML';
import {Platform} from 'react-native';
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

export interface CarouselProps extends ViewProps {
  thumbnailHeight: number;
  thumbnailAspectRatio?: number;
  media: ImageMediaItem[];
  displayCaptions?: boolean;
}

export const Carousel: React.FunctionComponent<PropsWithChildren<CarouselProps>> = ({thumbnailHeight, thumbnailAspectRatio = 1.3, media, displayCaptions = true, ...props}) => {
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
      <HTMLRendererConfig
        baseStyle={{
          fontSize: 12,
          fontFamily: Platform.select({
            android: 'Lato_400Regular_Italic',
            ios: 'Lato-Italic',
          }),
          textAlign: 'center',
        }}>
        <ImageList imageWidth={thumbnailWidth} imageHeight={thumbnailHeight} media={media} displayCaptions={displayCaptions} onPress={onPress} imageStyle={{borderRadius: 4}} />
      </HTMLRendererConfig>
      <ImageViewerModal visible={modalIndex !== null} onClose={onClose} media={media} startIndex={modalIndex ?? 0} />
    </View>
  );
};
