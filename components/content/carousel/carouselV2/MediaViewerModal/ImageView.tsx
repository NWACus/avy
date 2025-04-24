import {View} from 'components/core';
import {Image, useImage} from 'expo-image';
import React from 'react';
import {ActivityIndicator} from 'react-native';
import {ImageMediaItem} from 'types/nationalAvalancheCenter';

interface ImageViewProps {
  item: ImageMediaItem;
}

export const ImageView: React.FunctionComponent<ImageViewProps> = ({item}: ImageViewProps) => {
  const image = useImage(item.url.original);

  if (!image) {
    return (
      <View flex={1} alignContent="center" justifyContent="center">
        <ActivityIndicator size={'large'} />
      </View>
    );
  }

  return <Image style={{flex: 1}} contentFit="contain" contentPosition={'center'} source={item.url.original} />;
};
