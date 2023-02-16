import {View, VStack} from 'components/core';
import {BodyXSm, BodyXSmBlack} from 'components/text';
import React from 'react';
import {TextInput, TextInputProps} from 'react-native';
import {colorLookup} from 'theme';
import {merge} from 'lodash';
import {useController} from 'react-hook-form';

interface TextFieldProps extends TextInputProps {
  name: string;
  label: string;
}

const textInputDefaultStyle = {
  color: colorLookup('text'),
  fontSize: 16,
  fontFamily: 'Lato_400Regular',
};

export const TextField: React.FC<TextFieldProps> = ({name, label, style, ...props}) => {
  const {field, fieldState} = useController({name});
  return (
    <VStack width="100%" space={4}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <View p={8} borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4}>
        <TextInput
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          value={field.value}
          style={merge({}, textInputDefaultStyle, style)}
          placeholderTextColor={colorLookup('text.secondary')}
          {...props}
        />
      </View>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
};
