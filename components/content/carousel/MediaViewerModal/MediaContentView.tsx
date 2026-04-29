import {ImageView} from 'components/content/carousel/MediaViewerModal/ImageView';
import {PDFView} from 'components/content/carousel/MediaViewerModal/PDFView';
import {WebVideoView} from 'components/content/carousel/MediaViewerModal/WebVideoView';
import {View} from 'components/core';
import {BodySm} from 'components/text';
import {usePostHog} from 'posthog-react-native';
import React, {useEffect} from 'react';
import {useWindowDimensions} from 'react-native';
import {NativeGesture} from 'react-native-gesture-handler';
import {MediaItem, MediaType} from 'types/nationalAvalancheCenter';

interface MediaContentProps {
  item: MediaItem;
  isVisible: boolean;
  nativeGesture: NativeGesture;
}

export const MediaContentView: React.FunctionComponent<MediaContentProps> = ({item, isVisible, nativeGesture}) => {
  const postHog = usePostHog();
  const dimensions = useWindowDimensions();

  let content: React.JSX.Element;
  let isMediaSupported = true;

  if (item.type === MediaType.Image) {
    content = <ImageView item={item} nativeGesture={nativeGesture} fullScreenWidth={dimensions.width} />;
  } else if (item.type === MediaType.Video) {
    content = <WebVideoView item={item} isVisible={isVisible} />;
  } else if (item.type === MediaType.PDF) {
    content = <PDFView item={item} />;
  } else {
    isMediaSupported = false;
    content = <BodySm>{'Unsupported Media Type'}</BodySm>;
  }

  useEffect(() => {
    if (postHog && !isMediaSupported) {
      postHog.capture('mediaContentView-UnsupportedMedia', {mediaType: item.type});
    }
  }, [postHog, isMediaSupported, item]);

  return <View style={{width: dimensions.width, flex: 1}}>{content}</View>;
};
