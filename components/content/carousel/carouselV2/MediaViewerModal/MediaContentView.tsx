import {ImageView} from 'components/content/carousel/carouselV2/MediaViewerModal/ImageView';
import {WebVideoView} from 'components/content/carousel/carouselV2/MediaViewerModal/WebVideoView';
import {View} from 'components/core';
import {BodySm} from 'components/text';
import React from 'react';
import {Dimensions} from 'react-native';
import {MediaItem, MediaType} from 'types/nationalAvalancheCenter';

const SCREEN = Dimensions.get('screen');
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;

interface MediaContentProps {
  item: MediaItem;
  isVisible: boolean;
}

export const MediaContentView: React.FunctionComponent<MediaContentProps> = ({item, isVisible}: MediaContentProps) => {
  let content: React.JSX.Element;

  if (item.type === MediaType.Image) {
    content = <ImageView item={item} />;
  } else if (item.type === MediaType.Video) {
    content = <WebVideoView item={item} isVisible={isVisible} />;
  } else {
    content = <BodySm>{'Unsupported Media Type'}</BodySm>;
  }
  return <View style={{width: SCREEN_WIDTH, height: SCREEN_HEIGHT}}>{content}</View>;
};
