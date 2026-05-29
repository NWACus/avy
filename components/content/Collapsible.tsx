import React, {PropsWithChildren, useCallback, useEffect, useRef} from 'react';
import {LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Animated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

interface CollapsibleProps {
  collapsed: boolean;
  duration?: number;
  renderChildrenCollapsed?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Mimics the functionality of the react-native-collapsible package: animates its content between full height and
// zero height when `collapsed` toggles. Children stay mounted while collapsed (matching that library's default
// `renderChildrenCollapsed`) so that measured height stays current and form/input state is preserved. The content is
// absolutely positioned so it always reports its natural height via onLayout, even while the container is clipped to
// zero — this lets a card that starts collapsed still animate open the first time.
export const Collapsible: React.FunctionComponent<PropsWithChildren<CollapsibleProps>> = ({collapsed, duration = 300, style, children}) => {
  const height = useSharedValue<number | undefined>(undefined);
  const contentHeight = useRef(0);
  const measured = useRef(false);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const layoutHeight = event.nativeEvent.layout.height;
      contentHeight.current = layoutHeight;
      if (!measured.current) {
        // Snap to the correct height on the first measurement so the initial render doesn't animate from zero.
        measured.current = true;
        height.value = collapsed ? 0 : layoutHeight;
      } else if (!collapsed) {
        // Keep the height in sync if the content resizes while expanded.
        height.value = withTiming(layoutHeight, {duration, easing: Easing.out(Easing.cubic)});
      }
    },
    [collapsed, duration, height],
  );

  useEffect(() => {
    if (!measured.current) {
      return;
    }
    height.value = withTiming(collapsed ? 0 : contentHeight.current, {duration, easing: Easing.out(Easing.cubic)});
  }, [collapsed, duration, height]);

  const containerStyle = useAnimatedStyle(() => ({height: height.value}));

  return (
    <Animated.View style={[{overflow: 'hidden'}, containerStyle]}>
      <View onLayout={handleLayout} style={[StyleSheet.absoluteFill, {bottom: undefined}, style]}>
        {children}
      </View>
    </Animated.View>
  );
};

export default Collapsible;
