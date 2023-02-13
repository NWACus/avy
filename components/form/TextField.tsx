import {VStack} from 'components/core';
import {BodyXSm, BodyXSmBlack} from 'components/text';
import React from 'react';
import {TextInput, TextInputProps} from 'react-native';
import {colorLookup} from 'theme';
import {merge} from 'lodash';
import {useField} from 'formik';

interface TextFieldProps extends TextInputProps {
  name: string;
  label: string;
}

const textInputDefaultStyle = {
  padding: 8,
  color: colorLookup('darkText'),
  fontSize: 16,
  fontFamily: 'Lato_400Regular',
  borderColor: colorLookup('controlBorder'),
  borderWidth: 2,
  borderRadius: 4,
};

export const TextField: React.FC<TextFieldProps> = ({name, label, style, ...props}) => {
  const [field, meta, helpers] = useField<string>({name});
  return (
    <VStack width="100%" space={4}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <TextInput
        onBlur={() => helpers.setTouched(!meta.touched)}
        onChangeText={helpers.setValue}
        value={field.value}
        style={merge({}, textInputDefaultStyle, style)}
        placeholderTextColor={colorLookup('lightText')}
        {...props}></TextInput>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {meta.touched && meta.error && <BodyXSm color={colorLookup('error.900')}>{meta.error}</BodyXSm>}
    </VStack>
  );
};