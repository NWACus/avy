import {MediaLoadErrorView} from 'components/content/carousel/MediaViewerModal/MediaLoadErrorView';
import {Center, View} from 'components/core';
import {BodySm} from 'components/text';
import Constants from 'expo-constants';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, Platform} from 'react-native';
import WebView from 'react-native-webview';
import {WebViewErrorEvent, WebViewSource} from 'react-native-webview/lib/WebViewTypes';
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

  const [loadError, setLoadError] = useState<WebViewErrorEvent | null>(null);

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

  const onError = useCallback(
    (error: WebViewErrorEvent) => {
      setLoadError(error);
    },
    [setLoadError],
  );

  const onRetry = useCallback(() => {
    webRef.current?.reload();
    setLoadError(null);
  }, [webRef, setLoadError]);

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

  if (loadError) {
    return <WebViewLoadError error={loadError} onRetry={onRetry} />;
  }

  return (
    <WebView
      ref={webRef}
      bounces={false}
      style={{maxHeight: maxHeight, transform: [{translateY: yOffset}], backgroundColor: colorLookup('modal.background')}}
      source={sourceData}
      renderLoading={onRenderLoading}
      onError={onError}
      startInLoadingState
      allowsInlineMediaPlayback
      allowsFullscreenVideo
    />
  );
};

interface LoadErrorViewProps {
  error: WebViewErrorEvent;
  onRetry: () => void;
}

const ANDROID_OFFLINE_ERROR_CODE = -2;
const IOS_OFFLINE_ERROR_CODE = -1009;

const isOfflineErrorCode = (errorCode: number) => {
  return (Platform.OS === 'android' && errorCode == ANDROID_OFFLINE_ERROR_CODE) || (Platform.OS === 'ios' && errorCode == IOS_OFFLINE_ERROR_CODE);
};

const WebViewLoadError: React.FunctionComponent<LoadErrorViewProps> = ({error, onRetry}) => {
  const message = isOfflineErrorCode(error.nativeEvent.code)
    ? "It appears you're not connected to the internet. Please reconnect and try again."
    : 'An error occured loading the video. Please try again';

  return <MediaLoadErrorView message={message} onRetry={onRetry} />;
};
