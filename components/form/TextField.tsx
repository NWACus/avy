import {HStack, View, ViewProps, VStack} from 'components/core';
import {BodySm, BodySmBlack, BodyXSm} from 'components/text';
import React, {useCallback} from 'react';
import {useController} from 'react-hook-form';
import {View as RNView, TextInput, TextInputProps} from 'react-native';
import {colorLookup} from 'theme';

export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

interface TextFieldProps extends ViewProps {
  name: string;
  label: string;
  comment?: string;
  textTransform?: (text: string) => string;
  textInputProps?: Omit<TextInputProps, 'style'>;
  disabled?: boolean;
}

const textInputDefaultStyle = {
  color: colorLookup('text'),
  fontSize: 16,
  fontFamily: 'Lato_400Regular',
};

export const TextField = React.forwardRef<RNView, TextFieldProps>(({name, label, comment, textTransform, textInputProps = {}, disabled, ...props}, ref) => {
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

  return (
    <VStack width="100%" space={4} {...props} ref={ref}>
      <HStack space={4}>
        <BodySmBlack>{label}</BodySmBlack>
        {comment && <BodySm>{comment}</BodySm>}
      </HStack>
      <View p={8} borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4}>
        <TextInput
          onBlur={field.onBlur}
          onChangeText={onChangeText}
          value={field.value as string} // TODO(skuznets): determine why the generics here don't collapse to string itself ...
          style={textInputDefaultStyle}
          placeholderTextColor={colorLookup('text.tertiary')}
          editable={!disabled}
          {...textInputProps}
        />
      </View>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
});
TextField.displayName = 'TextField';
