import {WebMediaView, WebMediaViewHandle} from 'components/content/carousel/MediaViewerModal/WebMediaView';
import {Center} from 'components/core';
import {BodySm} from 'components/text';
import Constants from 'expo-constants';
import {useAnalytics} from 'hooks/useAnalytics';
import React, {useEffect, useRef} from 'react';
import {Platform} from 'react-native';
import {WebViewSource} from 'react-native-webview/lib/WebViewTypes';
import {AvalancheCenterID, VideoMediaItem} from 'types/nationalAvalancheCenter';

interface WebVideoViewProps {
  center_id: AvalancheCenterID;
  item: VideoMediaItem;
  isVisible: boolean;
}

const getSourceData = (item: VideoMediaItem): WebViewSource | never => {
  let source = '';
  if (typeof item.url !== 'string' && 'video_id' in item.url) {
    source = youtubeLink(item.url.video_id);
  } else {
    throw new Error('The item did not contain a video id ');
  }

  let headers = {};
  const bundleId = getBundleID();
  if (bundleId != null) {
    headers = {Referer: refererValue(bundleId)};
  } else {
    throw new Error('There was an error creating the header');
  }

  return {uri: source, headers: headers};
};

const getBundleID = () => {
  if (Platform.OS === 'ios') {
    return Constants.expoConfig?.ios?.bundleIdentifier;
  } else if (Platform.OS === 'android') {
    return Constants.expoConfig?.android?.package;
  } else {
    return undefined;
  }
};

// The only supported url format is an object that contains 'videoId'. If it's a string or contains 'external_link', we can't show it
const potentialUnsupportedVideoUrl = (url: VideoMediaItem['url']): string | null => {
  if (typeof url === 'string') {
    return url;
  } else if ('external_link' in url) {
    return url.external_link;
  }
  return null;
};

const youtubeLink = (videoId: string) => `https://youtube.com/embed/${videoId}`;
const refererValue = (bundleID: string) => `https://${bundleID}`;

export const WebVideoView: React.FunctionComponent<WebVideoViewProps> = ({center_id, item, isVisible}: WebVideoViewProps) => {
  const handleRef = useRef<WebMediaViewHandle>(null);
  const analytics = useAnalytics();

  useEffect(() => {
    if (!isVisible) {
      handleRef.current?.injectJavaScript(`document.querySelector('video').pause();`);
    }
  }, [isVisible]);

  useEffect(() => {
    const unsupportedUrl = potentialUnsupportedVideoUrl(item.url);
    if (unsupportedUrl !== null) {
      analytics.capture('unsupported_video_url_received', {center: center_id, url: unsupportedUrl});
    }
  }, [analytics, center_id, item.url]);

  let sourceData: WebViewSource;
  try {
    sourceData = getSourceData(item);
  } catch {
    return (
      <Center flex={1}>
        <BodySm color={'white'}>{'There was an error loading the video'}</BodySm>;
      </Center>
    );
  }

  return (
    <WebMediaView
      ref={handleRef}
      source={sourceData}
      heightFraction={0.33}
      errorMessage="An error occurred loading the video. Please try again"
      allowsInlineMediaPlayback
      allowsFullscreenVideo
    />
  );
};
