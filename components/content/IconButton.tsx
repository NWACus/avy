import {Ionicons, IoniconsIconName} from '@react-native-vector-icons/ionicons/static';
import React from 'react';
import {ColorValue, GestureResponderEvent, Insets, StyleProp, StyleSheet, TextStyle, TouchableHighlight, View, ViewStyle} from 'react-native';

export interface IconButtonProps {
  name: IoniconsIconName;
  accessibilityLabel: string;
  size?: number;
  color?: ColorValue;
  backgroundColor?: ColorValue;
  borderRadius?: number;
  underlayColor?: ColorValue;
  disabled?: boolean;
  hitSlop?: Insets;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
  onPress?: (event: GestureResponderEvent) => void;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 8,
  },
  touchable: {
    overflow: 'hidden',
  },
});

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  accessibilityLabel,
  size = 20,
  color = 'white',
  backgroundColor = 'transparent',
  borderRadius = 5,
  underlayColor,
  disabled,
  hitSlop,
  style,
  iconStyle,
  onPress,
}) => {
  const blockStyle = {backgroundColor, borderRadius};
  return (
    <TouchableHighlight
      style={[styles.touchable, blockStyle]}
      underlayColor={underlayColor}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled}}>
      <View style={[styles.container, blockStyle, style]}>
        <Ionicons name={name} size={size} color={color} style={iconStyle} />
      </View>
    </TouchableHighlight>
  );
};
