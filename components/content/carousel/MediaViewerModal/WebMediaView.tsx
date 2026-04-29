import {onlineManager} from '@tanstack/react-query';
import {MediaLoadErrorView} from 'components/content/carousel/MediaViewerModal/MediaLoadErrorView';
import {isOfflineErrorCode} from 'components/content/carousel/MediaViewerModal/webViewOfflineError';
import {View} from 'components/core';
import React, {Ref, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {ActivityIndicator, LayoutChangeEvent, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';
import {WebViewErrorEvent, WebViewSource} from 'react-native-webview/lib/WebViewTypes';
import {colorLookup} from 'theme';

export interface WebMediaViewHandle {
  reload: () => void;
  injectJavaScript: (script: string) => void;
}

export interface WebMediaViewProps {
  ref?: Ref<WebMediaViewHandle>;
  source: WebViewSource;
  heightFraction: number;
  errorMessage: string;
  allowsInlineMediaPlayback?: boolean;
  allowsFullscreenVideo?: boolean;
  scalesPageToFit?: boolean;
}

export const WebMediaView: React.FunctionComponent<WebMediaViewProps> = ({
  ref,
  source,
  heightFraction,
  errorMessage,
  allowsInlineMediaPlayback,
  allowsFullscreenVideo,
  scalesPageToFit,
}) => {
  const webRef = useRef<WebView>(null);

  const [containerHeight, setContainerHeight] = useState(0);
  const [loadError, setLoadError] = useState<WebViewErrorEvent | null>(null);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      reload: () => webRef.current?.reload(),
      injectJavaScript: (script: string) => webRef.current?.injectJavaScript(script),
    }),
    [],
  );

  useEffect(() => {
    return onlineManager.subscribe(() => {
      if (loadError && isOfflineErrorCode(loadError.nativeEvent.code) && onlineManager.isOnline()) {
        webRef.current?.reload();
        setLoadError(null);
      }
    });
  }, [loadError]);

  const maxViewHeight = containerHeight * heightFraction;

  const onRenderLoading = useCallback(() => {
    return (
      <View style={{...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: colorLookup('modal.background')}}>
        <ActivityIndicator size={'large'} />
      </View>
    );
  }, []);

  const onError = useCallback((error: WebViewErrorEvent) => {
    setLoadError(error);
  }, []);

  const onRetry = useCallback(() => {
    webRef.current?.reload();
    setLoadError(null);
  }, []);

  if (loadError) {
    const message = isOfflineErrorCode(loadError.nativeEvent.code) ? "It appears you're not connected to the internet. Please reconnect and try again." : errorMessage;
    return <MediaLoadErrorView message={message} onRetry={onRetry} />;
  }

  return (
    <View style={{flex: 1, justifyContent: 'center', backgroundColor: colorLookup('modal.background')}} onLayout={onContainerLayout}>
      <View style={{height: maxViewHeight, width: '100%'}}>
        <WebView
          ref={webRef}
          bounces={false}
          style={{flex: 1, backgroundColor: colorLookup('modal.background')}}
          source={source}
          renderLoading={onRenderLoading}
          onError={onError}
          startInLoadingState
          allowsInlineMediaPlayback={allowsInlineMediaPlayback}
          allowsFullscreenVideo={allowsFullscreenVideo}
          scalesPageToFit={scalesPageToFit}
        />
      </View>
    </View>
  );
};
