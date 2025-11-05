import {Center, View} from 'components/core';
import {BodySm} from 'components/text';
import Constants from 'expo-constants';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback, useEffect, useRef} from 'react';
import {ActivityIndicator, Dimensions, Platform} from 'react-native';
import WebView from 'react-native-webview';
import {WebViewSource} from 'react-native-webview/lib/WebViewTypes';
import {colorLookup} from 'theme';
import {VideoMediaItem} from 'types/nationalAvalancheCenter';

const SCREEN = Dimensions.get('screen');
const SCREEN_HEIGHT = SCREEN.height;

interface WebVideoViewProps {
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

const youtubeLink = (videoId: string) => `https://youtube.com/embed/${videoId}`;
const refererValue = (bundleID: string) => `https://${bundleID}`;

export const WebVideoView: React.FunctionComponent<WebVideoViewProps> = ({item, isVisible}: WebVideoViewProps) => {
  const webRef = useRef<WebView>(null);
  const postHog = usePostHog();

  useEffect(() => {
    if (!isVisible) {
      const jsCode = `document.querySelector('video').pause();`;
      webRef.current?.injectJavaScript(jsCode);
    }
  }, [isVisible]);

  // This centers the video within the modal
  const maxHeight = SCREEN_HEIGHT * 0.33;
  const yOffset = (SCREEN_HEIGHT - maxHeight) / 2;

  const onRenderLoading = useCallback(() => {
    return (
      <View flex={1} style={{transform: [{translateY: maxHeight / 2}], backgroundColor: colorLookup('modal.background')}}>
        <ActivityIndicator size={'large'} />
      </View>
    );
  }, [maxHeight]);

  useEffect(() => {
    if (postHog) {
      let properties: {[key: string]: string} = {};
      if (typeof item.url === 'string') {
        properties = {url: item.url};
      } else if ('external_link' in item.url) {
        properties = {url: item.url.external_link};
      }
      postHog.capture('webVideoView-UnsupportedVideoUrl', properties);
    }
  }, [postHog, item.url]);

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
    <WebView
      ref={webRef}
      bounces={false}
      style={{maxHeight: maxHeight, transform: [{translateY: yOffset}], backgroundColor: colorLookup('modal.background')}}
      source={sourceData}
      renderLoading={onRenderLoading}
      startInLoadingState
      allowsInlineMediaPlayback
      allowsFullscreenVideo
    />
  );
};
