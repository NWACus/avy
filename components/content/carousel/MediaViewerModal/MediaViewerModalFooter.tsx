import {View} from 'components/core';
import {HTML, HTMLRendererConfig} from 'components/text/HTML';
import React from 'react';
import {ScrollView} from 'react-native';
import {MediaItem} from 'types/nationalAvalancheCenter';

interface MediaViewerModalFooterProps {
  item: MediaItem;
}

const htmlStyle = {fontSize: 12, textAlign: 'center', color: 'white'} as const;

export const MediaViewerModalFooter: React.FunctionComponent<MediaViewerModalFooterProps> = ({item}) => {
  return (
    <View style={{position: 'absolute', zIndex: 1, bottom: 0, width: '100%'}}>
      <View flex={1} px={32} pb={16}>
        <ScrollView bounces={false}>
          {'caption' in item && (
            <HTMLRendererConfig baseStyle={htmlStyle}>
              <HTML source={{html: item.caption ?? ''}} />
            </HTMLRendererConfig>
          )}
        </ScrollView>
      </View>
    </View>
  );
};
