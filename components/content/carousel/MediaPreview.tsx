import {MediaViewerModal} from 'components/content/carousel/MediaViewerModal/MediaViewerModal';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {imageToThumbnailListItem, ThumbnailListItem, videoToThumbnailListItem} from 'components/content/carousel/ThumbnailList';
import {InternalError} from 'components/content/QueryState';
import {View, ViewProps, VStack} from 'components/core';
import {HTML, HTMLRendererConfig} from 'components/text/HTML';
import React, {useCallback, useMemo, useState} from 'react';
import {MediaItem, MediaType} from 'types/nationalAvalancheCenter';

const thumbnailListItem = (mediaItem: MediaItem): ThumbnailListItem | undefined => {
  const isYouTubeVideo = mediaItem.type === MediaType.Video && typeof mediaItem.url !== 'string' && !('external_link' in mediaItem.url);
  if (isYouTubeVideo) {
    return videoToThumbnailListItem(mediaItem);
  }

  if (mediaItem.type === MediaType.Image) {
    return imageToThumbnailListItem(mediaItem);
  }

  return undefined;
};

interface MediaPreviewProps extends ViewProps {
  thumbnailHeight: number;
  thumbnailAspectRatio?: number;
  mediaItem: MediaItem;
}

export const MediaPreview: React.FunctionComponent<MediaPreviewProps> = ({thumbnailHeight, thumbnailAspectRatio = 1.3, mediaItem}) => {
  const thumbnailWidth = thumbnailAspectRatio * thumbnailHeight;

  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const onPress = useCallback(
    (index: number) => {
      setModalIndex(index);
    },
    [setModalIndex],
  );
  const onClose = useCallback(() => setModalIndex(null), [setModalIndex]);
  const thumbnailItem = useMemo(() => thumbnailListItem(mediaItem), [mediaItem]);

  if (!thumbnailItem) {
    return <InternalError />;
  }

  return (
    <View>
      <VStack justifyContent="center" alignItems="center" space={8}>
        <NetworkImage
          width={thumbnailWidth}
          height={thumbnailHeight}
          uri={thumbnailItem.uri}
          index={0}
          showVideoIndicator={thumbnailItem.isVideo}
          onPress={onPress}
          imageStyle={{borderRadius: 4}}
        />
        {thumbnailItem.caption && (
          <View px={32}>
            <HTMLRendererConfig baseStyle={{fontSize: 12, textAlign: 'center', fontStyle: 'italic'}}>
              <HTML source={{html: thumbnailItem.caption}} />
            </HTMLRendererConfig>
          </View>
        )}
      </VStack>
      <MediaViewerModal visible={modalIndex !== null} startIndex={modalIndex ?? 0} mediaItems={[mediaItem]} onClose={onClose} />
    </View>
  );
};
