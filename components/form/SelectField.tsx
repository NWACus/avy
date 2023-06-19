import {Select, SelectRef, SelectStyles} from '@mobile-reality/react-native-select-pro';
import {VStack} from 'components/core';
import {bodySize, BodyXSm, BodyXSmBlack} from 'components/text';
import React, {useEffect, useRef} from 'react';
import {useController, useFormContext} from 'react-hook-form';
import {View as RNView} from 'react-native';
import {colorLookup} from 'theme';

interface Item {
  value: string;
  label: string;
}

interface SelectFieldProps {
  name: string;
  label: string;
  items: string[] | Item[];
  prompt?: string;
  radio?: boolean; // If true, will default to selecting first item and always enforce selection
  disabled?: boolean;
}

const borderColor = colorLookup('border.base');
const selectStyles: SelectStyles = {
  select: {
    container: {
      borderWidth: 2,
      borderColor,
      borderRadius: 4,
    },
    text: {
      color: colorLookup('text'),
      fontSize: bodySize,
      fontFamily: 'Lato_400Regular',
    },
    multiSelectedOption: {
      container: {
        backgroundColor: colorLookup('primary.outline'),
        borderWidth: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 400,
      },
      text: {
        color: colorLookup('text'),
        fontSize: 12,
        fontFamily: 'Lato_400Regular',
        textAlign: 'center',
      },
    },
  },
  option: {
    text: {
      color: colorLookup('text'),
      fontSize: bodySize,
      fontFamily: 'Lato_400Regular',
    },
  },
  optionsList: {
    borderWidth: 2,
    borderColor,
    borderRadius: 4,
    shadowColor: '#171717',
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
};

export const SelectField = React.forwardRef<RNView, SelectFieldProps>(({name, label, items, prompt, radio, disabled}, ref) => {
  const {setValue} = useFormContext();
  const {field, fieldState} = useController({name});
  const menuItems =
    typeof items[0] === 'string'
      ? (items as string[]).map(item => ({
          label: item,
          value: item,
        }))
      : (items as Item[]);
  const multiple = Array.isArray(field.value);

  const defaultOption = !Array.isArray(field.value) && Boolean(field.value) ? menuItems.find(item => item.value === field.value) : undefined;

  const selectRef = useRef<SelectRef>(null);
  useEffect(() => {
    // Make sure the internal state is cleared when the form is cleared
    if ((Array.isArray(field.value) && field.value.length === 0) || (!Array.isArray(field.value) && field.value === '')) {
      selectRef.current?.clear();
    }
  }, [selectRef, field.value, multiple]);

  return (
    <VStack width="100%" space={4} ref={ref}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <Select
        key={JSON.stringify(defaultOption)} // force a re-render when the default changes
        disabled={disabled}
        ref={selectRef}
        onSelect={({value: selectedValue}) => {
          const newValue = Array.isArray(field.value) ? field.value.concat([selectedValue]) : selectedValue;
          setValue(name, newValue, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
        }}
        onRemove={option => {
          const removedValue = option.value;
          const newValue = Array.isArray(field.value) ? field.value.filter(v => v !== removedValue) : '';
          setValue(name, newValue, {shouldValidate: false, shouldDirty: false, shouldTouch: false});
        }}
        styles={selectStyles}
        flatListProps={{
          // only works on Android, unfortunately
          persistentScrollbar: true,
        }}
        multiple={Array.isArray(field.value)}
        clearable={!radio}
        options={menuItems}
        placeholderText={prompt}
        placeholderTextColor={colorLookup('text.secondary') as string}
        defaultOption={defaultOption}
      />
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
});
SelectField.displayName = 'SelectField';
