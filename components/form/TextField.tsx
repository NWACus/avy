import {View, ViewProps, VStack} from 'components/core';
import {BodyXSm, BodyXSmBlack} from 'components/text';
import {merge} from 'lodash';
import React from 'react';
import {useController} from 'react-hook-form';
import {TextInput, TextInputProps, View as RNView} from 'react-native';
import {colorLookup} from 'theme';

export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

interface TextFieldProps extends ViewProps {
  name: string;
  label: string;
  textInputProps?: TextInputProps;
}

const textInputDefaultStyle = {
  color: colorLookup('text'),
  fontSize: 16,
  fontFamily: 'Lato_400Regular',
};

export const TextField = React.forwardRef<RNView, TextFieldProps>(({name, label, textInputProps: {style: textInputStyle, ...otherTextInputProps} = {}, ...props}, ref) => {
  const {field, fieldState} = useController({name});
  return (
    <VStack width="100%" space={4} {...props} ref={ref}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <View p={8} borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4}>
        <TextInput
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          value={field.value as string} // TODO(skuznets): determine why the generics here don't collapse to string itself ...
          style={merge({}, textInputDefaultStyle, textInputStyle)}
          placeholderTextColor={colorLookup('text.secondary')}
          {...otherTextInputProps}
        />
      </View>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
});
TextField.displayName = 'TextField';
