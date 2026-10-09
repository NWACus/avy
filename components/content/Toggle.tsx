import React, {useCallback, useEffect} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

import {colorLookup} from 'theme';

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_INSET = 2;
const THUMB_SIZE = TRACK_HEIGHT - THUMB_INSET * 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;
const DURATION = 200;

const OFF_TRACK_COLOR = colorLookup('disabled') as string;
const ON_TRACK_COLOR = colorLookup('primary') as string;

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Toggle: React.FC<ToggleProps> = ({value, onValueChange, disabled = false, accessibilityLabel}) => {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {duration: DURATION, easing: Easing.out(Easing.cubic)});
  }, [value, progress]);

  const onPress = useCallback(() => onValueChange(!value), [onValueChange, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [OFF_TRACK_COLOR, ON_TRACK_COLOR]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{translateX: progress.value * THUMB_TRAVEL}],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{checked: value, disabled}}
      style={disabled ? styles.disabled : undefined}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_INSET,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colorLookup('white') as string,
  },
  disabled: {
    opacity: 0.5,
  },
});
