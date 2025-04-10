import {MediaContentView} from 'components/content/carousel/carouselV2/MediaViewerModal/MediaContentView';
import {MediaViewerModalFooter} from 'components/content/carousel/carouselV2/MediaViewerModal/MediaViewerModalFooter';
import {MediaViewerModalHeader} from 'components/content/carousel/carouselV2/MediaViewerModal/MediaViewerModalHeader';
import {View} from 'components/core';
import React, {useCallback, useState} from 'react';
import {Dimensions, FlatList, Modal, ViewToken} from 'react-native';
import {colorLookup} from 'theme';
import {MediaItem, MediaType} from 'types/nationalAvalancheCenter';

const SCREEN = Dimensions.get('screen');
const SCREEN_WIDTH = SCREEN.width;

export interface MediaViewerModalProps {
  visible: boolean;
  startIndex: number;
  mediaItems: MediaItem[];
  onClose: () => void;
}

const getItemId = (item: MediaItem) => {
  if (item.type === '' || item.type === null || item.type === MediaType.PDF || item.type === MediaType.Unknown) {
    return undefined;
  }

  return item.id;
};

export const MediaViewerModal: React.FunctionComponent<MediaViewerModalProps> = ({visible, startIndex, mediaItems, onClose}: MediaViewerModalProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(startIndex);

  const renderItem = useCallback(
    ({item}: {item: MediaItem}) => {
      const visibleItemId = getItemId(mediaItems[currentItemIndex]);
      const renderItemId = getItemId(item);

      return <MediaContentView item={item} isVisible={visibleItemId === renderItemId} />;
    },
    [mediaItems, currentItemIndex],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  const onViewableItemsChanged = useCallback(
    ({changed}: {changed: ViewToken<MediaItem>[]}) => {
      if (changed.length == 0) {
        return;
      }

      // Since we're only viewing 1 item at a time, changed only contains 1 item
      const changedViewableItem = changed[0];
      if (changedViewableItem.isViewable) {
        setCurrentItemIndex(changedViewableItem.index ?? 0);
      }
    },
    [setCurrentItemIndex],
  );

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="fade">
      <View flex={1} style={{backgroundColor: colorLookup('modal.background')}}>
        <MediaViewerModalHeader index={currentItemIndex} mediaCount={mediaItems.length} onClose={onClose} />
        <FlatList
          data={mediaItems}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{itemVisiblePercentThreshold: 90}}
          initialScrollIndex={startIndex}
        />
        <MediaViewerModalFooter item={mediaItems[currentItemIndex]} />
      </View>
    </Modal>
  );
};
