import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {KeyboardAvoidingView, LayoutChangeEvent, Modal, Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';
import {Gesture, GestureDetector, GestureHandlerRootView, GestureStateChangeEvent, GestureUpdateEvent, PanGestureHandlerEventPayload} from 'react-native-gesture-handler';
import Animated, {useAnimatedStyle, useSharedValue, withSpring, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {scheduleOnRN} from 'react-native-worklets';

import {useKeyboardBehavior} from 'hooks/useKeyboardBehavior';
import {colorLookup} from 'theme';

export enum DrawerModalDisplayType {
  halfScreenOnly = 'halfScreenOnly',
  fullScreen = 'fullScreen',
}

interface DrawerProps {
  isVisible: boolean;
  onDismiss: () => void;
  drawerDisplayType?: DrawerModalDisplayType;
  children: React.ReactNode;
}

const DRAG_DISMISS_DISTANCE = 80;
const DRAG_DISMISS_VELOCITY = 500;
const OVERLAY_FADE_DURATION = 200;
const DISMISS_DURATION = 250;
const SPRING_CONFIG = {damping: 20, stiffness: 220, overshootClamping: true};

export const DrawerModal: React.FC<DrawerProps> = ({isVisible, onDismiss, drawerDisplayType = DrawerModalDisplayType.halfScreenOnly, children}) => {
  const insets = useSafeAreaInsets();
  const {height: windowHeight} = useWindowDimensions();
  const keyboardBehavior = useKeyboardBehavior();

  const [modalVisible, setModalVisible] = useState(isVisible);

  const translateY = useSharedValue(windowHeight);
  const overlayOpacity = useSharedValue(0);

  const sheetHeightRef = useRef(windowHeight);
  const dismissingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const maxHeight = useMemo(() => {
    const fullScreenMax = windowHeight - insets.top;
    return drawerDisplayType === DrawerModalDisplayType.fullScreen ? fullScreenMax : Math.min(fullScreenMax, windowHeight * 0.5);
  }, [drawerDisplayType, windowHeight, insets.top]);

  const handleHideComplete = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleDismissComplete = useCallback(() => {
    setModalVisible(false);
    onDismissRef.current();
  }, []);

  const animateIn = useCallback(() => {
    dismissingRef.current = false;
    translateY.value = withSpring(0, SPRING_CONFIG);
    overlayOpacity.value = withTiming(0.3, {duration: OVERLAY_FADE_DURATION});
  }, [translateY, overlayOpacity]);

  const animateOut = useCallback(
    (notifyDismiss: boolean) => {
      const target = sheetHeightRef.current;
      const onComplete = notifyDismiss ? handleDismissComplete : handleHideComplete;
      overlayOpacity.value = withTiming(0, {duration: DISMISS_DURATION});
      translateY.value = withTiming(target, {duration: DISMISS_DURATION}, finished => {
        if (finished) {
          scheduleOnRN(onComplete);
        }
      });
    },
    [translateY, overlayOpacity, handleDismissComplete, handleHideComplete],
  );

  const performDismiss = useCallback(() => {
    if (dismissingRef.current) {
      return;
    }
    dismissingRef.current = true;
    animateOut(true);
  }, [animateOut]);

  useEffect(() => {
    if (isVisible) {
      dismissingRef.current = false;
      setModalVisible(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && modalVisible) {
      animateIn();
    }
  }, [isVisible, modalVisible, animateIn]);

  useEffect(() => {
    if (!isVisible && modalVisible && !dismissingRef.current) {
      dismissingRef.current = true;
      animateOut(false);
    }
  }, [isVisible, modalVisible, animateOut]);

  const onSheetLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      sheetHeightRef.current = height;
    }
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
          if (event.translationY > 0) {
            translateY.value = event.translationY;
          }
        })
        .onEnd((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
          if (event.translationY > DRAG_DISMISS_DISTANCE || event.velocityY > DRAG_DISMISS_VELOCITY) {
            scheduleOnRN(performDismiss);
          } else {
            translateY.value = withSpring(0, SPRING_CONFIG);
          }
        }),
    [translateY, performDismiss],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={performDismiss} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={performDismiss} />
        </Animated.View>
        <KeyboardAvoidingView behavior={keyboardBehavior} style={styles.sheetContainer} pointerEvents="box-none">
          <Animated.View style={[styles.sheet, {maxHeight, paddingBottom: insets.bottom}, sheetStyle]} onLayout={onSheetLayout}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000C',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colorLookup('white'),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    flexGrow: 0,
    flexShrink: 0,
  },
  handle: {
    backgroundColor: '#DDD',
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flexShrink: 1,
  },
});
