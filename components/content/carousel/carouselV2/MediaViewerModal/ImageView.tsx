import {View} from 'components/core';
import {Image, useImage} from 'expo-image';
import React, {useState} from 'react';
import {ActivityIndicator} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  NativeGesture,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {runOnJS, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {ImageMediaItem} from 'types/nationalAvalancheCenter';

interface ImageViewProps {
  item: ImageMediaItem;
  nativeGesture: NativeGesture | null;
  fullScreenWidth: number | null;
}

const MAX_SCALE = 8.0;
const MIN_SCALE = 1.0;
const DOUBLE_TAP_SCALE = 1.5;
const RESET_TRANSLATION_VALUE = 0.0;

export const ImageView: React.FunctionComponent<ImageViewProps> = ({item, nativeGesture, fullScreenWidth}) => {
  const image = useImage(item.url.original);

  const scale = useSharedValue(1);
  const startScale = useSharedValue(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const prevTranslateX = useSharedValue(0);
  const prevTranslateY = useSharedValue(0);

  const [panEnabled, setPanEnabled] = useState(false);

  const setPanOnJS = (value: boolean) => {
    setPanEnabled(value);
  };

  const resetTransforms = () => {
    'worklet';
    scale.value = withTiming(MIN_SCALE);
    translateX.value = withTiming(RESET_TRANSLATION_VALUE);
    translateY.value = withTiming(RESET_TRANSLATION_VALUE);
    runOnJS(setPanOnJS)(false);
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
      scale.value = startScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        resetTransforms();
        return;
      }

      if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE);
      }

      runOnJS(setPanOnJS)(true);
    });

  const panGesture = Gesture.Pan()
    .onStart((_: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      prevTranslateX.value = translateX.value;
      prevTranslateY.value = translateY.value;
    })
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      translateX.value = prevTranslateX.value + event.translationX / (1.5 * scale.value);
      translateY.value = prevTranslateY.value + event.translationY / (1.5 * scale.value);
    })
    .onEnd(() => {
      if (fullScreenWidth != null) {
        const maxXTranslate = 0.5 * fullScreenWidth - (0.5 * fullScreenWidth) / scale.value;

        if (maxXTranslate > 0 && Math.abs(translateX.value) > maxXTranslate) {
          translateX.value = translateX.value > 0 ? withTiming(maxXTranslate) : withTiming(-1 * maxXTranslate);
        }
      }
    });

  if (nativeGesture != null) {
    panGesture.enabled(panEnabled);
    panGesture.blocksExternalGesture(nativeGesture);
  }

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        resetTransforms();
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        runOnJS(setPanOnJS)(true);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}, {translateX: translateX.value}, {translateY: translateY.value}],
  }));

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTap);

  if (!image) {
    return (
      <View flex={1} alignContent="center" justifyContent="center">
        <ActivityIndicator size={'large'} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{flex: 1}, animatedStyle]}>
        <Image style={[{flex: 1}, animatedStyle]} contentFit="contain" contentPosition={'center'} source={item.url.original} />
      </Animated.View>
    </GestureDetector>
  );
};
