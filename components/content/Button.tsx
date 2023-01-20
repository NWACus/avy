import {Center, View, ViewProps} from 'components/core';
import React, {useState} from 'react';
import {ColorValue, GestureResponderEvent, Pressable, Text} from 'react-native';
import tinycolor from 'tinycolor2';
import {colorLookup} from 'theme';

export interface ButtonProps extends ViewProps {
  color?: ColorValue;
  onPress?: (event: GestureResponderEvent) => void;
}

export const Button: React.FC<ButtonProps> = ({color = 'color-primary', children, onPress, ...props}) => {
  const [pressedBgColor] = useState<ColorValue>(tinycolor(colorLookup(color)).setAlpha(0.2).toRgbString());
  const [pressed, setIsPressed] = useState<boolean>(false);

  return (
    <View borderColor={colorLookup(color)} borderWidth={2} borderRadius={4} p={8} {...props} backgroundColor={pressed ? pressedBgColor : undefined}>
      <Pressable onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} onPress={event => onPress?.(event)}>
        <Center>
          <Text style={{color: colorLookup(color)}}>{children}</Text>
        </Center>
      </Pressable>
    </View>
  );
};
