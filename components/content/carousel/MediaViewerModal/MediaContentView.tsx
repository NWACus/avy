import {ImageView} from 'components/content/carousel/MediaViewerModal/ImageView';
import {PDFView} from 'components/content/carousel/MediaViewerModal/PDFView';
import {WebVideoView} from 'components/content/carousel/MediaViewerModal/WebVideoView';
import {View} from 'components/core';
import {BodySm} from 'components/text';
import {useAnalytics} from 'hooks/useAnalytics';
import React, {useEffect} from 'react';
import {useWindowDimensions} from 'react-native';
import {NativeGesture} from 'react-native-gesture-handler';
import {AvalancheCenterID, MediaItem, MediaType} from 'types/nationalAvalancheCenter';

interface MediaContentProps {
  center_id: AvalancheCenterID;
  item: MediaItem;
  isVisible: boolean;
  nativeGesture: NativeGesture;
}

export const MediaContentView: React.FunctionComponent<MediaContentProps> = ({center_id, item, isVisible, nativeGesture}) => {
  const analytics = useAnalytics();
  const dimensions = useWindowDimensions();

  let content: React.JSX.Element;
  let isMediaSupported = true;

  if (item.type === MediaType.Image) {
    content = <ImageView item={item} nativeGesture={nativeGesture} fullScreenWidth={dimensions.width} />;
  } else if (item.type === MediaType.Video) {
    content = <WebVideoView item={item} isVisible={isVisible} center_id={center_id} />;
  } else if (item.type === MediaType.PDF) {
    content = <PDFView item={item} center_id={center_id} />;
  } else {
    isMediaSupported = false;
    content = <BodySm>{'Unsupported Media Type'}</BodySm>;
  }

  useEffect(() => {
    if (!isMediaSupported) {
      analytics.capture('unsupported_media_found', {center: center_id, media_type: item.type});
    }
  }, [analytics, center_id, isMediaSupported, item]);

  return <View style={{width: dimensions.width, flex: 1}}>{content}</View>;
};
