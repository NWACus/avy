import {HStack, View, VStack} from 'components/core';
import {Body, bodySize, BodyXSm, BodyXSmBlack} from 'components/text';
import React from 'react';
import {colorLookup} from 'theme';
import {HoldItem} from 'react-native-hold-menu';
import {AntDesign} from '@expo/vector-icons';
import {useController, useFormContext} from 'react-hook-form';

interface SelectFieldProps {
  name: string;
  label: string;
  items: string[];
  prompt: string;
}

const borderColor = colorLookup('border.base');

export const SelectField: React.FC<SelectFieldProps> = ({name, label, items, prompt}) => {
  const {setValue} = useFormContext();
  const {field, fieldState} = useController({name});
  const menuItems = items.map(item => ({
    text: item,
    onPress: () => {
      setValue(name, item, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
    },
  }));

  return (
    <VStack width="100%" space={4}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <HoldItem items={menuItems} activateOn="tap" closeOnTap>
        <View borderColor={borderColor} borderWidth={2} borderRadius={4} p={8} flexDirection="column" justifyContent="center">
          <HStack justifyContent="space-between" alignItems="center">
            <Body>{field.value || prompt}</Body>
            <AntDesign name="down" size={bodySize} color={colorLookup('text')} />
          </HStack>
        </View>
      </HoldItem>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
};
