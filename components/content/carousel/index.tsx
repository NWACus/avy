import React, {PropsWithChildren, useCallback, useState} from 'react';

import {ActivityIndicator, FlatList, Image, ImageProps, Modal, TouchableOpacity} from 'react-native';

import {AntDesign, FontAwesome5} from '@expo/vector-icons';

import {Center, HStack, View, ViewProps, VStack} from 'components/core';
import {MediaItem} from 'types/nationalAvalancheCenter';
import {Body, BodySm} from 'components/text';
import {HTML, HTMLRendererConfig} from 'components/text/HTML';
import {colorLookup, COLORS} from 'theme/colors';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

type NetworkImageState = 'loading' | 'ready' | 'error';

interface NetworkImageProps {
  uri: string;
  width: number;
  height: number;
  index: number;
  onStateChange: (state: NetworkImageState) => void;
  onPress: (index: number) => void;
  borderRadius?: number;
  imageStyle?: ImageProps['style'];
}

const NetworkImage: React.FC<NetworkImageProps> = ({uri, width, height, onStateChange, index, onPress, borderRadius = 16, imageStyle}) => {
  const [state, setState] = useState<NetworkImageState>('loading');
  const [imageSize, setImageSize] = useState([0, 0]);

  // with this style, the available space is always completely filled. a portrait image is cropped to fit the available space.
  const croppedThumbnailStyle = {
    width,
    height,
    flex: 1,
    borderRadius: borderRadius,
  };

  // with this style, the full thumbnail is always visible. a portrait image will leave whitespace on the sides.
  const _fullThumbnailStyle = {
    width: imageSize[0] === 0 ? undefined : imageSize[0],
    height: imageSize[1] === 0 ? undefined : imageSize[1],
    aspectRatio: imageSize[1] > 0 ? imageSize[0] / imageSize[1] : 1,
    flex: 1,
    borderRadius: imageSize[1] > imageSize[0] ? 0 : borderRadius, // don't round the corners of a vertical image
  };

  return (
    <Center width={width} height={height} borderColor={colorLookup('light.200')} borderWidth={1} borderRadius={borderRadius}>
      {state === 'loading' && <ActivityIndicator style={{height: Math.min(32, height / 2)}} />}
      {state === 'error' && (
        <VStack space={8} alignItems="center">
          <FontAwesome5 name="exclamation-triangle" size={Math.min(32, height / 2)} color={COLORS['warning.700']} />
          <Body>Media failed to load.</Body>
        </VStack>
      )}
      {(state === 'ready' || state === 'loading') && (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(index)} disabled={state !== 'ready'}>
          <Image
            source={{uri}}
            onLoad={({
              nativeEvent: {
                source: {width, height},
              },
            }) => {
              setImageSize([width, height]);
              setState('ready');
              onStateChange('ready');
            }}
            onError={_e => setState('error')}
            style={{
              width: imageSize[0] === 0 ? undefined : imageSize[0],
              height: imageSize[1] === 0 ? undefined : imageSize[1],
              aspectRatio: imageSize[1] > 0 ? imageSize[0] / imageSize[1] : 1,
              flex: 1,
              ...croppedThumbnailStyle,
              ...(typeof imageStyle === 'object' ? imageStyle : {}),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </Center>
  );
};

interface ImageListProps extends ViewProps {
  imageHeight: number;
  imageWidth: number;
  media: MediaItem[];
  displayCaptions?: boolean;
  onPress?: (index: number) => void;
}

const ImageList: React.FunctionComponent<PropsWithChildren<ImageListProps>> = ({imageHeight, imageWidth, media, displayCaptions = true, onPress = () => undefined, ...props}) => {
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

export interface CarouselProps extends ViewProps {
  thumbnailHeight: number;
  thumbnailAspectRatio?: number;
  media: MediaItem[];
  displayCaptions?: boolean;
}

export const Carousel: React.FunctionComponent<PropsWithChildren<CarouselProps>> = ({thumbnailHeight, thumbnailAspectRatio = 1.3, media, displayCaptions = true, ...props}) => {
  const thumbnailWidth = thumbnailAspectRatio * thumbnailHeight;

  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const onPress = useCallback(
    (index: number) => {
      console.log('onpress', media[index], index);
      setModalIndex(index);
    },
    [media],
  );

  return (
    <View {...props}>
      <HTMLRendererConfig baseStyle={{fontSize: 12, fontFamily: 'Lato_400Regular_Italic', textAlign: 'center'}}>
        <ImageList imageWidth={thumbnailWidth} imageHeight={thumbnailHeight} media={media} displayCaptions={displayCaptions} onPress={onPress} />
        <Modal visible={modalIndex !== null} animationType="fade" onRequestClose={() => setModalIndex(null)} transparent={false}>
          <SafeAreaProvider>
            <SafeAreaView style={{backgroundColor: '#333333'}}>
              <VStack height="100%" width="100%" justifyContent="space-between" pb={32} space={32}>
                <HStack width="100%" justifyContent="space-between" alignItems="center" height={64}>
                  <View width={64} height={64} />
                  <Center>
                    <BodySm color="white">
                      {modalIndex + 1} / {media.length}
                    </BodySm>
                  </Center>
                  <AntDesign.Button
                    size={32}
                    color="white"
                    name="close"
                    backgroundColor="#333333"
                    iconStyle={{marginRight: 0}}
                    style={{textAlign: 'center', paddingRight: 8}}
                    onPress={() => setModalIndex(null)}
                  />
                </HStack>
                <View flex={1} justifyContent="center">
                  <HTMLRendererConfig baseStyle={{fontSize: 12, textAlign: 'center', color: 'white'}}>
                    <ImageList imageWidth={428} imageHeight={(428 * 4) / 3.0} media={media} displayCaptions={true} />
                  </HTMLRendererConfig>
                </View>
              </VStack>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      </HTMLRendererConfig>
    </View>
  );
};
