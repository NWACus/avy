import {Center, View, ViewProps} from 'components/core';
import {bodySize} from 'components/text';
import React, {useState} from 'react';
import {ActivityIndicator, ColorValue, GestureResponderEvent, Pressable, Text} from 'react-native';
import {colorLookup} from 'theme';

interface ButtonStyle {
  backgroundColor?: ColorValue;
  borderColor: ColorValue;
  textColor: ColorValue;
  disabled: {
    backgroundColor?: ColorValue;
    borderColor: ColorValue;
    textColor: ColorValue;
  };
  pressed: {
    backgroundColor?: ColorValue;
    borderColor: ColorValue;
    textColor: ColorValue;
  };
}

type PredefinedButtonStyle = 'normal' | 'primary' | 'destructive';

const styles = {
  normal: {
    borderColor: colorLookup('primary'),
    textColor: colorLookup('primary'),
    disabled: {
      backgroundColor: colorLookup('disabled'),
      borderColor: colorLookup('disabled'),
      textColor: colorLookup('text'),
    },
    pressed: {
      borderColor: colorLookup('blue2'),
      textColor: colorLookup('blue2'),
    },
  },
  primary: {
    backgroundColor: colorLookup('primary'),
    borderColor: colorLookup('primary'),
    textColor: colorLookup('white'),
    disabled: {
      backgroundColor: colorLookup('disabled'),
      borderColor: colorLookup('disabled'),
      textColor: colorLookup('text'),
    },
    pressed: {
      borderColor: colorLookup('blue2'),
      backgroundColor: colorLookup('blue2'),
      textColor: colorLookup('white'),
    },
  },
  destructive: {
    backgroundColor: colorLookup('error.color'),
    borderColor: colorLookup('error.color'),
    textColor: colorLookup('white'),
    disabled: {
      backgroundColor: colorLookup('disabled'),
      borderColor: colorLookup('disabled'),
      textColor: colorLookup('text'),
    },
    pressed: {
      borderColor: colorLookup('error.color-primary'),
      backgroundColor: colorLookup('error.color-primary'),
      textColor: colorLookup('white'),
    },
  },
};

interface BaseButtonProps extends ViewProps {
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  busy?: boolean;
}

interface StyledButtonProps extends BaseButtonProps {
  buttonStyle: ButtonStyle;
  onPress?: (event: GestureResponderEvent) => void;
}

const StyledButton: React.FC<StyledButtonProps> = ({buttonStyle, children, onPress, disabled = false, busy = false, ...props}) => {
  const [pressed, setIsPressed] = useState<boolean>(false);
  const colorStyleSource = disabled ? buttonStyle.disabled : pressed ? buttonStyle.pressed : buttonStyle;
  const {backgroundColor, borderColor, textColor} = colorStyleSource;

  return (
    <View borderColor={borderColor} borderWidth={2} borderRadius={8} py={12} px={16} {...props} backgroundColor={backgroundColor}>
      <Pressable disabled={disabled} onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} onPress={event => onPress?.(event)}>
        <Center>
          <View style={{position: 'relative'}}>
            <Text style={{color: textColor}}>{children}</Text>
            {busy && <ActivityIndicator size={bodySize} color={textColor} style={{position: 'absolute', right: -1.5 * bodySize, top: 0.25 * bodySize}} />}
          </View>
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
