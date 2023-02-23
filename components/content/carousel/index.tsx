import React, {PropsWithChildren, useCallback, useState} from 'react';

import {ImageList} from 'components/content/carousel/ImageList';
import {ImageViewerModal} from 'components/content/carousel/ImageViewerModal';
import {View, ViewProps} from 'components/core';
import {HTMLRendererConfig} from 'components/text/HTML';
import {MediaItem} from 'types/nationalAvalancheCenter';

export interface CarouselProps extends ViewProps {
  thumbnailHeight: number;
  thumbnailAspectRatio?: number;
  media: MediaItem[];
  displayCaptions?: boolean;
}

export const Carousel: React.FunctionComponent<PropsWithChildren<CarouselProps>> = ({thumbnailHeight, thumbnailAspectRatio = 1.3, media, displayCaptions = true, ...props}) => {
  const thumbnailWidth = thumbnailAspectRatio * thumbnailHeight;

  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const onPress = useCallback((index: number) => {
    setModalIndex(index);
  }, []);

  return (
    <View {...props}>
      <HTMLRendererConfig baseStyle={{fontSize: 12, fontFamily: 'Lato_400Regular_Italic', textAlign: 'center'}}>
        <ImageList imageWidth={thumbnailWidth} imageHeight={thumbnailHeight} media={media} displayCaptions={displayCaptions} onPress={onPress} />
      </HTMLRendererConfig>
      <ImageViewerModal visible={modalIndex !== null} onClose={() => setModalIndex(null)} media={media} startIndex={modalIndex} />
    </View>
  );
};
