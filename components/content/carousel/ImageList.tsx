import React, {PropsWithChildren, useCallback, useState} from 'react';

import {FlatList} from 'react-native';

import {View, ViewProps, VStack} from 'components/core';
import {MediaItem} from 'types/nationalAvalancheCenter';
import {HTML} from 'components/text/HTML';
import {NetworkImage, NetworkImageState} from 'components/content/carousel/NetworkImage';

export interface ImageListProps extends ViewProps {
  imageHeight: number;
  imageWidth: number;
  media: MediaItem[];
  displayCaptions?: boolean;
  onPress?: (index: number) => void;
}

export const ImageList: React.FunctionComponent<PropsWithChildren<ImageListProps>> = ({
  imageHeight,
  imageWidth,
  media,
  displayCaptions = true,
  onPress = () => undefined,
  ...props
}) => {
  const padding = 16;

  // Loading state is used to force the FlatList to re-render when the image state changes.
  // Without this, the inputs to FlatList wouldn't change, and so it would never re-render individual list items.
  const [loadingState, setLoadingState] = useState<NetworkImageState[]>(media.map(() => 'loading'));

  const onPressCallback = useCallback(
    (index: number) => {
      console.log('onpress', media[index], index);
      onPress(index);
    },
    [media, onPress],
  );

  const renderItem = useCallback(
    ({item, index}) => (
      <VStack space={4} width={imageWidth + padding} alignItems="stretch" flex={1}>
        <NetworkImage
          width={imageWidth}
          height={imageHeight}
          uri={item.url.thumbnail}
          index={index}
          onPress={onPressCallback}
          onStateChange={state => {
            loadingState[index] = state;
            setLoadingState(loadingState);
          }}
        />
        {displayCaptions && (
          <View flex={1} px={32}>
            <HTML source={{html: item.caption}} />
          </View>
        )}
      </VStack>
    ),
    [imageHeight, imageWidth, loadingState, displayCaptions, onPressCallback],
  );

  return (
    <FlatList horizontal data={media} extraData={loadingState} renderItem={renderItem} centerContent snapToInterval={imageWidth + padding} snapToAlignment="center" {...props} />
  );
};
