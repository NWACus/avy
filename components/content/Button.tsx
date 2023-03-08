import {Center, View, ViewProps} from 'components/core';
import React, {useState} from 'react';
import {ColorValue, GestureResponderEvent, Pressable, Text} from 'react-native';
import {colorLookup} from 'theme';
import tinycolor from 'tinycolor2';

interface ButtonStyle {
  backgroundColor?: ColorValue;
  borderColor: ColorValue;
  textColor: ColorValue;
  disabledBackgroundColor?: ColorValue;
  disabledBorderColor: ColorValue;
  disabledTextColor: ColorValue;
  pressedBackgroundColor: ColorValue;
}

type PredefinedButtonStyle = 'normal' | 'primary' | 'destructive';

const styles = {
  normal: {
    borderColor: colorLookup('primary'),
    textColor: colorLookup('primary'),
    disabledBorderColor: tinycolor(colorLookup('primary')).desaturate(80).toRgbString(),
    disabledTextColor: tinycolor(colorLookup('primary')).desaturate(80).toRgbString(),
    disabledBackgroundColor: tinycolor(colorLookup('primary')).setAlpha(0.2).desaturate(80).toRgbString(),
    pressedBackgroundColor: tinycolor(colorLookup('primary')).setAlpha(0.2).toRgbString(),
  },
  primary: {
    backgroundColor: colorLookup('primary'),
    borderColor: colorLookup('primary'),
    textColor: colorLookup('white'),
    disabledBackgroundColor: tinycolor(colorLookup('primary')).desaturate(80).toRgbString(),
    disabledBorderColor: tinycolor(colorLookup('primary')).desaturate(80).toRgbString(),
    disabledTextColor: tinycolor(colorLookup('white')).desaturate(80).toRgbString(),
    pressedBackgroundColor: tinycolor(colorLookup('primary')).setAlpha(0.6).toRgbString(),
  },
  destructive: {
    backgroundColor: colorLookup('red.700'),
    borderColor: colorLookup('red.700'),
    textColor: colorLookup('white'),
    disabledBackgroundColor: tinycolor(colorLookup('red.700')).desaturate(80).toRgbString(),
    disabledBorderColor: tinycolor(colorLookup('red.700')).desaturate(80).toRgbString(),
    disabledTextColor: tinycolor(colorLookup('red.700')).desaturate(80).toRgbString(),
    pressedBackgroundColor: tinycolor(colorLookup('red.700')).setAlpha(0.6).toRgbString(),
  },
};

interface BaseButtonProps extends ViewProps {
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

interface StyledButtonProps extends BaseButtonProps {
  buttonStyle: ButtonStyle;
  onPress?: (event: GestureResponderEvent) => void;
}

const StyledButton: React.FC<StyledButtonProps> = ({buttonStyle, children, onPress, disabled = false, ...props}) => {
  const [pressed, setIsPressed] = useState<boolean>(false);
  const {borderColor, textColor, pressedBackgroundColor, backgroundColor, disabledBackgroundColor, disabledBorderColor, disabledTextColor} = buttonStyle;

  return (
    <View
      borderColor={disabled ? disabledBorderColor : borderColor}
      borderWidth={2}
      borderRadius={12}
      p={8}
      {...props}
      backgroundColor={disabled ? disabledBackgroundColor : pressed ? pressedBackgroundColor : backgroundColor}>
      <Pressable disabled={disabled} onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} onPress={event => onPress?.(event)}>
        <Center>
          <Text style={{color: disabled ? disabledTextColor : textColor}}>{children}</Text>
        </Center>
      </Pressable>
    </View>
  );
};

interface ButtonProps extends BaseButtonProps {
  buttonStyle?: PredefinedButtonStyle;
  onPress?: (event: GestureResponderEvent) => void;
}

export const Button: React.FC<ButtonProps> = ({buttonStyle = 'normal', ...props}) => <StyledButton buttonStyle={styles[buttonStyle]} {...props} />;
