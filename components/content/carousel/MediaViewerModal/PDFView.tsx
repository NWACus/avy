import {WebMediaView} from 'components/content/carousel/MediaViewerModal/WebMediaView';
import {usePostHog} from 'posthog-react-native';
import React, {useEffect} from 'react';
import {Platform} from 'react-native';
import {WebViewSource} from 'react-native-webview/lib/WebViewTypes';
import {PDFMediaItem} from 'types/nationalAvalancheCenter';

interface PDFViewProps {
  item: PDFMediaItem;
}

const googleDocsViewer = (url: string) => `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

const getPdfSource = (item: PDFMediaItem): WebViewSource => ({
  uri: Platform.OS === 'android' ? googleDocsViewer(item.url.original) : item.url.original,
});

export const PDFView: React.FunctionComponent<PDFViewProps> = ({item}: PDFViewProps) => {
  const postHog = usePostHog();

  useEffect(() => {
    if (postHog) {
      postHog.capture('pdfView-Opened', {url: item.url.original});
    }
  }, [postHog, item.url.original]);

  return <WebMediaView source={getPdfSource(item)} heightFraction={0.7} errorMessage="An error occurred loading the PDF. Please try again" scalesPageToFit />;
};
