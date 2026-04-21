import {BottomTabBarHeightCallbackContext, BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React, {useCallback, useContext} from 'react';
import {LayoutChangeEvent, StyleSheet, Text, TouchableOpacity} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {colorLookup} from 'theme';

interface TabItemProps {
  routeKey: string;
  routeName: string;
  label: string;
  isFocused: boolean;
  tabBarIcon: ((props: {focused: boolean; color: string; size: number}) => React.ReactNode) | undefined;
  onTabPress: (routeKey: string, routeName: string, isFocused: boolean) => void;
}

const TabItem: React.FunctionComponent<TabItemProps> = ({routeKey, routeName, label, isFocused, tabBarIcon, onTabPress}) => {
  const onPress = useCallback(() => {
    onTabPress(routeKey, routeName, isFocused);
  }, [onTabPress, routeKey, routeName, isFocused]);

  const color = isFocused ? (colorLookup('primary') as string) : (colorLookup('text.secondary') as string);

  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} accessibilityRole="button" accessibilityState={isFocused ? {selected: true} : {}} accessibilityLabel={label}>
      {tabBarIcon?.({focused: isFocused, color, size: 24})}
      <Text style={[styles.label, {color}]}>{label}</Text>
    </TouchableOpacity>
  );
};

interface AnimatedBottomTabProps extends BottomTabBarProps {
  isVisible: boolean;
}

export const AnimatedBottomTabBar: React.FunctionComponent<AnimatedBottomTabProps> = ({state, descriptors, navigation, insets, isVisible}) => {
  const measuredHeight = useSharedValue(0);
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const {height} = e.nativeEvent.layout;
      measuredHeight.value = height;
      onHeightChange?.(height);
    },
    [measuredHeight, onHeightChange],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: withTiming(isVisible ? 0 : measuredHeight.value, {duration: 300})}],
  }));

  const handleTabPress = useCallback(
    (routeKey: string, routeName: string, isFocused: boolean) => {
      const event = navigation.emit({type: 'tabPress', target: routeKey, canPreventDefault: true});
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  return (
    <Animated.View style={[styles.container, {paddingBottom: insets.bottom}, animatedStyle]} onLayout={handleLayout}>
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;
        const label = typeof descriptor.options.tabBarLabel === 'string' ? descriptor.options.tabBarLabel : route.name;
        return (
          <TabItem
            key={route.key}
            routeKey={route.key}
            routeName={route.name}
            label={label}
            isFocused={isFocused}
            tabBarIcon={descriptor.options.tabBarIcon}
            onTabPress={handleTabPress}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: colorLookup('white') as string,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colorLookup('text.secondary') as string,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});
