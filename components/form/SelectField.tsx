import _ from 'lodash';

import {Select, SelectRef, SelectStyles} from '@mobile-reality/react-native-select-pro';
import {Button} from 'components/content/Button';
import {HStack, VStack} from 'components/core';
import {FieldLabel} from 'components/form/FieldLabel';
import {Body, BodyBlack, BodyXSm, bodySize} from 'components/text';
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {useController, useFormContext} from 'react-hook-form';
import {Platform, View as RNView} from 'react-native';
import {colorLookup} from 'theme';

interface Item {
  value: string;
  label: string;
}

interface HelpText {
  title: string;
  contentHtml: string;
}

interface SelectFieldProps {
  name: string;
  label: string;
  quickPickItems?: string[] | Item[];
  otherItems?: string[] | Item[];
  prompt?: string;
  disabled?: boolean;
  invisible?: boolean;
  minOtherItemsShown?: number;
  required?: boolean;
  helpText?: HelpText;
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
      fontFamily: Platform.select({
        android: 'Lato_400Regular',
        ios: 'Lato-Regular',
      }),
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
        fontFamily: Platform.select({
          android: 'Lato_400Regular',
          ios: 'Lato-Regular',
        }),
        textAlign: 'center',
      },
    },
  },
  option: {
    text: {
      color: colorLookup('text'),
      fontSize: bodySize,
      fontFamily: Platform.select({
        android: 'Lato_400Regular',
        ios: 'Lato-Regular',
      }),
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

export const SelectField = React.forwardRef<RNView, SelectFieldProps>(
  ({name, label, quickPickItems, otherItems, prompt, disabled, invisible, minOtherItemsShown, required, helpText}, ref) => {
    const {setValue} = useFormContext();
    const {field, fieldState} = useController({name});
    const multiple = Array.isArray(field.value);

    const quickPickMenuItems =
      quickPickItems && quickPickItems.length > 0
        ? typeof quickPickItems[0] === 'string'
          ? (quickPickItems as string[]).map(item => ({
              label: item,
              value: item,
            }))
          : (quickPickItems as Item[])
        : undefined;
    const selectMenuItems =
      otherItems && otherItems.length > 0
        ? typeof otherItems[0] === 'string'
          ? (otherItems as string[]).map(item => ({
              label: item,
              value: item,
            }))
          : (otherItems as Item[])
        : undefined;

    // Validate the items passed in
    useEffect(() => {
      if (!quickPickItems && !otherItems) {
        throw new Error('quickPickItems and otherItems cannot both be undefined');
      }
      if (quickPickMenuItems && selectMenuItems) {
        quickPickMenuItems.forEach(item => {
          if (selectMenuItems.find(x => x.value === item.value)) {
            throw new Error('quickPickItems and otherItems must be distinct lists');
          }
        });
      }
    }, [otherItems, quickPickItems, quickPickMenuItems, selectMenuItems]);

    // If the field is required and we have quick pick items default to the first item
    useEffect(() => {
      if (
        required &&
        quickPickMenuItems &&
        quickPickMenuItems.length > 0 &&
        ((Array.isArray(field.value) && field.value.length === 0) || (!Array.isArray(field.value) && !field.value))
      ) {
        setValue(name, quickPickMenuItems[0].value, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
      }
    }, [name, required, quickPickMenuItems, setValue, field.value]);

    const quickPickSelectionHandlers = useMemo(
      () =>
        quickPickMenuItems
          ? quickPickMenuItems.map(item => () => {
              // Clear item if it is already selected
              if ((Array.isArray(field.value) && field.value.includes(item.value)) || item.value === field.value) {
                // We can only clear the item if it is not required or if it is a multi-select and
                // there is more then one item selected
                if (!required || (Array.isArray(field.value) && field.value.length > 1)) {
                  const newValue = Array.isArray(field.value) ? field.value.filter(v => v !== item.value) : '';
                  setValue(name, newValue, {shouldValidate: false, shouldDirty: false, shouldTouch: false});
                }
                return;
              }

              // Otherwise select item
              const newValue = Array.isArray(field.value) ? field.value.concat([item.value]) : item.value;
              setValue(name, newValue, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
            })
          : [],
      [name, quickPickMenuItems, required, field.value, setValue],
    );

    const selectRef = useRef<SelectRef>(null);
    const selectDefaultOption = !Array.isArray(field.value) && Boolean(field.value) ? selectMenuItems?.find(item => item.value === field.value) : undefined;
    useEffect(() => {
      // Make sure the internal state is cleared when the form is cleared
      if ((Array.isArray(field.value) && field.value.length === 0) || (!Array.isArray(field.value) && field.value === '')) {
        selectRef.current?.clear();
      }
    }, [selectRef, field.value, multiple]);
    const onSelect = useCallback(
      ({value: selectedValue}: Item) => {
        const newValue = Array.isArray(field.value) ? field.value.concat([selectedValue]) : selectedValue;
        setValue(name, newValue, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
      },
      [field.value, name, setValue],
    );
    const onRemove = useCallback(
      (option: Item) => {
        const removedValue = option.value;
        const newValue = Array.isArray(field.value) ? field.value.filter(v => v !== removedValue) : '';
        setValue(name, newValue, {shouldValidate: false, shouldDirty: false, shouldTouch: false});
      },
      [field.value, name, setValue],
    );

    // RowMargin is the space between rows if the list of buttons wraps onto a second row. We subtract
    // it from top margin of the HStack to stop the first row of buttons from being offset down.
    const rowMargin = 5;

    return (
      <VStack width="100%" space={4} ref={ref} style={invisible && {display: 'none'}}>
        <FieldLabel label={label} required={required} helpText={helpText} />
        {quickPickMenuItems && (
          <HStack space={5} flexWrap="wrap" marginTop={-rowMargin} backgroundColor={fieldState.error && colorLookup('error.outline')}>
            {quickPickMenuItems.map((item, index) => {
              const selected = item.value === field.value;
              const LabelFont = selected ? BodyBlack : Body;
              return (
                <Button
                  key={item.label}
                  onPress={quickPickSelectionHandlers[index]}
                  buttonStyle={selected ? 'primary' : 'normal'}
                  px={8}
                  py={4}
                  marginTop={rowMargin}
                  borderWidth={1}
                  disabled={disabled}>
                  <LabelFont>{item.label}</LabelFont>
                </Button>
              );
            })}
          </HStack>
        )}
        {selectMenuItems && (
          <Select
            key={JSON.stringify(selectDefaultOption)} // force a re-render when the default changes
            disabled={disabled}
            ref={selectRef}
            onSelect={onSelect}
            onRemove={onRemove}
            styles={_.merge({}, selectStyles, {
              optionsList: {
                minHeight: Math.min(minOtherItemsShown ?? 10, selectMenuItems.length) * 40,
              },
            })}
            // Setting `scrollToSelectedOption` based on https://github.com/MobileReality/react-native-select-pro/issues/230
            // Seems to fix problem with items not showing up in list
            scrollToSelectedOption={false}
            theme="none"
            flatListProps={{
              // only works on Android, unfortunately
              persistentScrollbar: true,
            }}
            multiple={Array.isArray(field.value)}
            clearable={!required}
            options={selectMenuItems}
            placeholderText={prompt}
            placeholderTextColor={colorLookup('text.secondary') as string}
            defaultOption={selectDefaultOption}
          />
        )}
        {/* TODO: animate the appearance/disappearance of the error string */}
        {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
      </VStack>
    );
  },
);
SelectField.displayName = 'SelectField';
