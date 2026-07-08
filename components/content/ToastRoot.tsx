import {logger} from 'logger';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Easing, LayoutChangeEvent, View} from 'react-native';

export type ToastPosition = 'top' | 'bottom';

export interface ToastConfigParams<Props = unknown> {
  type: string;
  position: ToastPosition;
  isVisible: boolean;
  text1?: string;
  onPress?: () => void;
  props?: Props;
}

export interface ToastShowParams {
  type?: string;
  text1?: string;
  position?: ToastPosition;
  autoHide?: boolean;
  visibilityTime?: number;
  onPress?: () => void;
}

type ToastConfig = Record<string, (params: ToastConfigParams<string>) => React.ReactElement>;

interface ToastProps {
  config: ToastConfig;
  bottomOffset?: number;
  topOffset?: number;
  visibilityTime?: number;
}

interface ActiveToast {
  type: string;
  text1?: string;
  position: ToastPosition;
  onPress?: () => void;
}

interface ToastRef {
  show: (params: ToastShowParams) => void;
  hide: () => void;
}

const ANIMATION_DURATION = 250;
const DEFAULT_VISIBILITY_TIME = 4000;

// The mounted root registers itself here so the static Toast.show/Toast.hide can reach it from anywhere
// (including non-React callers like the observation uploader listener), mirroring react-native-toast-message.
let toastRef: ToastRef | null = null;

// The slide is driven by the legacy Animated API with the native driver, NOT Reanimated. On Android + Fabric
// (RN 0.85), Reanimated applies every animation frame as a UI-thread ShadowTree commit; during the post-push
// window where this toast typically appears, the UI thread is busy mounting the forecast tabs, so those
// commits drop frames for seconds and stall touch dispatch for the whole screen. Native-driver Animated
// updates the view property directly with no per-frame commits, which is how react-native-toast-message
// animated smoothly through the same window. The Fabric stale-hit-target bug with native-driver transforms
// (facebook/react-native#51621) only bites views that REST at a transformed position; this toast rests at
// translateY: 0, where the transformed and committed layout positions coincide, so its hit box is correct
// whenever it is expected to be tappable. The outer wrapper below is pinned by React at the resting
// position and never animates.
const ToastComponent: React.FC<ToastProps> = ({config, bottomOffset = 40, topOffset = 40, visibilityTime = DEFAULT_VISIBILITY_TIME}) => {
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current; // 0: hidden offscreen, 1: resting position
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    logger.debug({stack: new Error().stack}, 'Toast.hide');
    clearTimer();
    setIsVisible(false);
  }, [clearTimer]);

  const show = useCallback(
    (params: ToastShowParams) => {
      logger.debug({type: params.type, text1: params.text1, autoHide: params.autoHide ?? true, stack: new Error().stack}, 'Toast.show');
      clearTimer();
      setActiveToast({
        type: params.type ?? 'info',
        text1: params.text1,
        position: params.position ?? 'bottom',
        onPress: params.onPress,
      });
      setIsVisible(true);
      if (params.autoHide ?? true) {
        hideTimer.current = setTimeout(hide, params.visibilityTime ?? visibilityTime);
      }
    },
    [clearTimer, hide, visibilityTime],
  );

  useEffect(() => {
    toastRef = {show, hide};
    return () => {
      clearTimer();
      if (toastRef?.show === show) {
        toastRef = null;
      }
    };
  }, [show, hide, clearTimer]);

  // Drive the slide from a post-render effect so the toast is mounted and measured before it animates, and
  // clear the content only once the slide-out finishes.
  useEffect(() => {
    if (!activeToast || measuredHeight === 0) {
      return;
    }
    const easing = isVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic);
    const animation = Animated.timing(progress, {toValue: isVisible ? 1 : 0, duration: ANIMATION_DURATION, easing, useNativeDriver: true});
    animation.start(({finished}) => {
      if (finished && !isVisible) {
        setActiveToast(null);
        setMeasuredHeight(0);
      }
    });
    return () => animation.stop();
  }, [isVisible, activeToast, measuredHeight, progress]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasuredHeight(event.nativeEvent.layout.height);
  }, []);

  if (!activeToast) {
    return null;
  }

  const position = activeToast.position;
  const hiddenDistance = measuredHeight + (position === 'top' ? topOffset : bottomOffset);
  const translateY = progress.interpolate({inputRange: [0, 1], outputRange: [position === 'top' ? -hiddenDistance : hiddenDistance, 0]});

  return (
    <View pointerEvents="box-none" style={[{position: 'absolute', left: 0, right: 0}, position === 'top' ? {top: topOffset} : {bottom: bottomOffset}]}>
      <Animated.View
        pointerEvents={isVisible ? 'box-none' : 'none'}
        onLayout={onLayout}
        // Hidden until measured: the slide distance is unknown before the first layout, so without this
        // gate the toast would flash partially on-screen for a frame.
        style={{width: '100%', alignItems: 'center', opacity: measuredHeight === 0 ? 0 : 1, transform: [{translateY}]}}>
        {config[activeToast.type]?.({
          type: activeToast.type,
          position: activeToast.position,
          isVisible,
          text1: activeToast.text1,
          onPress: activeToast.onPress,
        })}
      </Animated.View>
    </View>
  );
};

// Memoized so re-renders of App can't reach the Animated.View: with the native driver, a React commit can
// re-apply the JS-side (stale) transform over the natively-driven one. With memo, the component only
// re-renders on its own show/hide/measure state changes, each of which immediately re-drives the animation.
const Toast = Object.assign(React.memo(ToastComponent), {
  show: (params: ToastShowParams) => toastRef?.show(params),
  hide: () => toastRef?.hide(),
});

export default Toast;
