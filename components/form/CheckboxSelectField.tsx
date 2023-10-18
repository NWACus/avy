import {HStack, VStack, View, ViewProps} from 'components/core';
import {Body, BodyXSmBlack, TextWrapperProps} from 'components/text';
import Checkbox from 'expo-checkbox';
import React, {useCallback} from 'react';
import {useController, useFormContext} from 'react-hook-form';
import {colorLookup} from 'theme';

interface Item {
  label: string;
  value: string;
}

interface CheckboxSelectFieldProps extends ViewProps {
  name: string;
  label?: string;
  items: Item[];
  radio?: boolean; // If true, will default to selecting first item and always enforce selection
  disabled?: boolean;
  labelComponent?: React.FunctionComponent<TextWrapperProps>;
  labelSpace?: number;
}

// This component renders a column of checkboxes for the given items
// It's an alternative to SelectField when you don't want a dropdown
export function CheckboxSelectField({name, label, items, disabled, labelComponent = BodyXSmBlack, labelSpace = 4, radio, ...props}: CheckboxSelectFieldProps) {
  const {setValue} = useFormContext();
  const {field} = useController({name});
  const onChange = useCallback(
    (item: Item, checked: boolean) => {
      if (checked) {
        const newValue = Array.isArray(field.value) ? field.value.concat([item.value]) : item.value;
        setValue(name, newValue, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
      } else {
        const removedValue = item.value;
        const newValue = Array.isArray(field.value) ? field.value.filter(v => v !== removedValue) : '';
        if (radio && newValue === '') {
          // We don't allow clearing the selection when `radio` is true
          return;
        }
        setValue(name, newValue, {shouldValidate: false, shouldDirty: false, shouldTouch: false});
      }
    },
    [field, name, setValue, radio],
  );

  return (
    <VStack width="100%" space={labelSpace} flex={1} flexGrow={1} bg={'white'} {...props}>
      {label && labelComponent({children: label})}
      {items.map(({value, label}, index) => (
        <HStack
          key={index}
          width="100%"
          height={40}
          justifyContent="space-between"
          alignItems="center"
          space={8}
          borderBottomWidth={1}
          borderColor={colorLookup('primary.background')}>
          <View>
            <Body>{label}</Body>
          </View>
          <Checkbox
            disabled={disabled}
            value={Array.isArray(field.value) ? field.value.includes(value) : field.value === value}
            onValueChange={(checked: boolean) => onChange({value, label}, checked)}
            color={colorLookup('blue1')}
          />
        </HStack>
      ))}
    </VStack>
  );
}

CheckboxSelectField.displayName = 'CheckboxSelectField';
