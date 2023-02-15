import {Center, View, ViewProps} from 'components/core';
import React, {useState} from 'react';
import {ColorValue, GestureResponderEvent, Pressable, Text} from 'react-native';
import tinycolor from 'tinycolor2';
import {colorLookup} from 'theme';

interface ButtonStyle {
  backgroundColor?: ColorValue;
  borderColor: ColorValue;
  textColor: ColorValue;
  pressedBackgroundColor: ColorValue;
}

type PredefinedButtonStyle = 'normal' | 'primary' | 'destructive';

const styles = {
  normal: {
    borderColor: colorLookup('primary'),
    textColor: colorLookup('primary'),
    pressedBackgroundColor: tinycolor(colorLookup('primary')).setAlpha(0.2).toRgbString(),
  },
  primary: {
    backgroundColor: colorLookup('primary'),
    borderColor: colorLookup('primary'),
    textColor: colorLookup('white'),
    pressedBackgroundColor: tinycolor(colorLookup('primary')).setAlpha(0.6).toRgbString(),
  },
  destructive: {
    backgroundColor: colorLookup('red.700'),
    borderColor: colorLookup('red.700'),
    textColor: colorLookup('white'),
    pressedBackgroundColor: tinycolor(colorLookup('red.700')).setAlpha(0.6).toRgbString(),
  },
};

interface BaseButtonProps extends ViewProps {
  onPress?: (event: GestureResponderEvent) => void;
}

interface StyledButtonProps extends BaseButtonProps {
  buttonStyle: ButtonStyle;
  onPress?: (event: GestureResponderEvent) => void;
}

const StyledButton: React.FC<StyledButtonProps> = ({buttonStyle, children, onPress, ...props}) => {
  const [pressed, setIsPressed] = useState<boolean>(false);
  const {borderColor, textColor, pressedBackgroundColor, backgroundColor} = buttonStyle;

  return (
    <View borderColor={borderColor} borderWidth={2} borderRadius={12} p={8} {...props} backgroundColor={pressed ? pressedBackgroundColor : backgroundColor}>
      <Pressable onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} onPress={event => onPress?.(event)}>
        <Center>
          <Text style={{color: textColor}}>{children}</Text>
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
