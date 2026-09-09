import {WebMediaView} from 'components/content/carousel/MediaViewerModal/WebMediaView';
import {useAnalytics} from 'hooks/useAnalytics';
import React, {useEffect} from 'react';
import {Platform} from 'react-native';
import {WebViewSource} from 'react-native-webview/lib/WebViewTypes';
import {AvalancheCenterID, PDFMediaItem} from 'types/nationalAvalancheCenter';

interface PDFViewProps {
  center_id: AvalancheCenterID;
  item: PDFMediaItem;
}

const googleDocsViewer = (url: string) => `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

const getPdfSource = (item: PDFMediaItem): WebViewSource => ({
  uri: Platform.OS === 'android' ? googleDocsViewer(item.url.original) : item.url.original,
});

export const PDFView: React.FunctionComponent<PDFViewProps> = ({center_id, item}: PDFViewProps) => {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.capture('pdf_opened', {center: center_id, url: item.url.original});
  }, [analytics, center_id, item.url.original]);

  return <WebMediaView source={getPdfSource(item)} heightFraction={0.7} errorMessage="An error occurred loading the PDF. Please try again" scalesPageToFit />;
};
