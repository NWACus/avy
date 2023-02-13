import {HStack, View, VStack} from 'components/core';
import {Body, bodySize, BodyXSm, BodyXSmBlack} from 'components/text';
import React from 'react';
import {colorLookup} from 'theme';
import {useField, useFormikContext} from 'formik';
import {HoldItem} from 'react-native-hold-menu';
import {AntDesign} from '@expo/vector-icons';

interface SelectFieldProps {
  name: string;
  label: string;
  items: string[];
  prompt: string;
}

const borderColor = colorLookup('controlBorder');

export const SelectField: React.FC<SelectFieldProps> = ({name, label, items, prompt}) => {
  const [field, meta, helpers] = useField<string>({name});
  const {handleChange, handleBlur, setFieldTouched} = useFormikContext();
  const {setValue} = helpers;
  console.log('render select field:', field, meta);

  const menuItems = items.map(item => ({
    text: item,
    onPress: () => {
      setValue(item, false);
      handleChange(name);
      setFieldTouched(name);
      handleBlur(name);
      console.log(`set ${name} to ${item}`);
    },
  }));

  return (
    <VStack width="100%" space={4}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <HoldItem items={menuItems} activateOn="tap" closeOnTap>
        <View borderColor={borderColor} borderWidth={2} borderRadius={4} p={8} flexDirection="column" justifyContent="center">
          <HStack justifyContent="space-between" alignItems="center">
            <Body>{field.value || prompt}</Body>
            <AntDesign name="down" size={bodySize} color={colorLookup('darkText')} />
          </HStack>
        </View>
      </HoldItem>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {meta.touched && meta.error && <BodyXSm color={colorLookup('error.900')}>{meta.error}</BodyXSm>}
    </VStack>
  );
};
