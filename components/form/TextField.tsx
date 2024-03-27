import {HStack, View, ViewProps, VStack} from 'components/core';
import {BodySm, BodySmBlack, BodyXSm} from 'components/text';
import React, {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {useController} from 'react-hook-form';
import {Pressable, View as RNView, StyleSheet, TextInput, TextInputProps} from 'react-native';
import {colorLookup} from 'theme';

export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

interface TextFieldProps extends ViewProps {
  name: string;
  label: string;
  comment?: string;
  textTransform?: (text: string) => string;
  textInputProps?: Omit<TextInputProps, 'style'>;
  disabled?: boolean;
  hideLabel?: boolean;
}

const textInputDefaultStyle = {
  color: colorLookup('text'),
  fontSize: 16,
  fontFamily: 'Lato_400Regular',
};

export const TextField = React.forwardRef<RNView, TextFieldProps>(({name, label, comment, textTransform, textInputProps = {}, disabled, hideLabel = false, ...props}, ref) => {
  const {field, fieldState} = useController({name});

  const onChangeText = useCallback(
    (text: string): void => {
      if (textTransform) {
        field.onChange(textTransform(text));
      } else {
        field.onChange(text);
      }
    },
    [textTransform, field],
  );

  const onBlur = useCallback(() => {
    setFocused(false);
    field.onBlur();
  }, [field]);

  const onFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const textFieldRef = useRef<TextInput>(null);
  const [isFocused, setFocused] = useState(() => textFieldRef?.current?.isFocused ?? false);

  useLayoutEffect(() => {
    setFocused(textFieldRef?.current?.isFocused ?? false);
  }, []);

  const handleFocusField = useCallback(() => {
    textFieldRef.current?.focus();
  }, []);

  return (
    <VStack width="100%" space={4} {...props} ref={ref}>
      {!hideLabel && (
        <HStack space={4}>
          <BodySmBlack>{label}</BodySmBlack>
          {comment && <BodySm>{comment}</BodySm>}
        </HStack>
      )}
      <Pressable style={styles.pressContainer} onPress={handleFocusField}>
        <View
          p={8}
          flexBasis={'auto'}
          flexGrow={1}
          flexShrink={0}
          display="flex"
          borderWidth={2}
          borderColor={isFocused ? colorLookup('border.active') : colorLookup('border.base')}
          borderRadius={4}>
          <TextInput
            ref={textFieldRef}
            onBlur={onBlur}
            onFocus={onFocus}
            onChangeText={onChangeText}
            value={field.value as string} // TODO(skuznets): determine why the generics here don't collapse to string itself ...
            style={textInputDefaultStyle}
            placeholderTextColor={colorLookup('text.tertiary')}
            editable={!disabled}
            {...textInputProps}
          />
        </View>
      </Pressable>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
});
TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  pressContainer: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});
