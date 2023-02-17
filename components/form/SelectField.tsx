import {VStack} from 'components/core';
import {BodyXSm, BodyXSmBlack} from 'components/text';
import React, {useEffect, useRef} from 'react';
import {colorLookup} from 'theme';
import {useController, useFormContext} from 'react-hook-form';
import {Select, SelectRef, SelectStyles} from '@mobile-reality/react-native-select-pro';

interface SelectFieldProps {
  name: string;
  label: string;
  items: string[];
  prompt: string;
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
      fontSize: 16,
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
      fontSize: 16,
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

export const SelectField: React.FC<SelectFieldProps> = ({name, label, items, prompt}) => {
  const {setValue} = useFormContext();
  const {
    field: {value},
    fieldState,
  } = useController({name});
  const menuItems = items.map(item => ({
    label: item,
    value: item,
  }));
  const multiple = Array.isArray(value);

  const ref = useRef<SelectRef>(null);
  useEffect(() => {
    // Make sure the internal state is cleared when the form is cleared
    if ((multiple && value.length === 0) || (!multiple && value === '')) {
      ref.current.clear();
    }
  }, [ref, value, multiple]);

  return (
    <VStack width="100%" space={4}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <Select
        ref={ref}
        onSelect={({value: selectedValue}) => {
          const newValue = multiple ? value.concat([selectedValue]) : selectedValue;
          setValue(name, newValue, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
        }}
        onRemove={option => {
          // This is bs, option is never an array, the type decl is wrong. https://github.com/MobileReality/react-native-select-pro/issues/187
          const removedValue = Array.isArray(option) ? option[0].value : option.value;
          const newValue = multiple ? value.filter(v => v !== removedValue) : null;
          setValue(name, newValue, {shouldValidate: false, shouldDirty: false, shouldTouch: false});
        }}
        styles={selectStyles}
        flatListProps={{
          // only works on Android, unfortunately
          persistentScrollbar: true,
        }}
        multiple={multiple}
        clearable
        options={menuItems}
        placeholderText={prompt}
        placeholderTextColor={colorLookup('text.secondary') as string}
      />
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
};
