import {MediaViewerModal} from 'components/content/carousel/MediaViewerModal/MediaViewerModal';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {PDFThumbnail} from 'components/content/carousel/PDFThumbnail';
import {InternalError} from 'components/content/QueryState';
import {View, ViewProps, VStack} from 'components/core';
import {HTML, HTMLRendererConfig} from 'components/text/HTML';
import React, {useCallback, useMemo, useState} from 'react';
import {ImageMediaItem, MediaItem, MediaType, PDFMediaItem, VideoMediaItem} from 'types/nationalAvalancheCenter';

interface MediaPreview {
  kind: 'image' | 'video' | 'pdf';
  uri: string;
  caption: string | null;
  title: string | null | undefined;
}

const videoToMediaPreview = (item: VideoMediaItem): MediaPreview => {
  if (typeof item.url === 'string' || 'external_link' in item.url) {
    return {
      kind: 'video',
      uri: '',
      caption: item.caption,
      title: item.title,
    };
  }

  const url = item.url;
  return {
    kind: 'video',
    uri: url['thumbnail'],
    caption: item.caption,
    title: item.title,
  };
};

const imageToMediaPreview = (item: ImageMediaItem): MediaPreview => {
  return {
    kind: 'image',
    uri: item.url['thumbnail'],
    caption: item.caption,
    title: item.title,
  };
};

const pdfToMediaPreview = (_item: PDFMediaItem): MediaPreview => {
  return {
    kind: 'pdf',
    uri: '',
    caption: null,
    title: undefined,
  };
};

const mediaPreview = (mediaItem: MediaItem): MediaPreview | undefined => {
  const isYouTubeVideo = mediaItem.type === MediaType.Video && typeof mediaItem.url !== 'string' && !('external_link' in mediaItem.url);
  if (isYouTubeVideo) {
    return videoToMediaPreview(mediaItem);
  }

  if (mediaItem.type === MediaType.Image) {
    return imageToMediaPreview(mediaItem);
  }

  if (mediaItem.type === MediaType.PDF) {
    return pdfToMediaPreview(mediaItem);
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
  const mediaPreviewItem = useMemo(() => mediaPreview(mediaItem), [mediaItem]);

  if (!mediaPreviewItem) {
    return (
      <View width={thumbnailWidth} height={thumbnailHeight}>
        <InternalError />
      </View>
    );
  }

  return (
    <View>
      <VStack justifyContent="center" alignItems="center" space={8}>
        {mediaPreviewItem.kind === 'pdf' ? (
          <PDFThumbnail width={thumbnailWidth} height={thumbnailHeight} index={0} onPress={onPress} imageStyle={{borderRadius: 4}} />
        ) : (
          <NetworkImage
            width={thumbnailWidth}
            height={thumbnailHeight}
            uri={mediaPreviewItem.uri}
            index={0}
            showVideoIndicator={mediaPreviewItem.kind === 'video'}
            onPress={onPress}
            imageStyle={{borderRadius: 4}}
          />
        )}
        {mediaPreviewItem.caption && (
          <View px={32}>
            <HTMLRendererConfig baseStyle={{fontSize: 12, textAlign: 'center', fontStyle: 'italic'}}>
              <HTML source={{html: mediaPreviewItem.caption}} />
            </HTMLRendererConfig>
          </View>
        )}
      </VStack>
      <MediaViewerModal visible={modalIndex !== null} startIndex={modalIndex ?? 0} mediaItems={[mediaItem]} onClose={onClose} />
    </View>
  );
};
