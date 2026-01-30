import {Select, SelectRef, SelectStyles} from '@mobile-reality/react-native-select-pro';
import {Button} from 'components/content/Button';
import {HStack, VStack, ViewProps} from 'components/core';
import {Body, BodyBlack, BodySmBlack, BodyXSm, bodySize} from 'components/text';
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {useController, useFormContext} from 'react-hook-form';
import {Platform} from 'react-native';
import {colorLookup} from 'theme';

interface Item {
  label: string;
  value: string;
}

interface ButtonSelectFieldProps extends ViewProps {
  name: string;
  label?: string;
  quickPickItems: Item[];
  otherItems?: Item[];
  minOtherItemsShown?: number;
  disabled?: boolean;
  labelSpace?: number;
  required?: boolean;
}

/**
 * This component renders a horizontal stack of buttons for the user to select from. Other items can
 * be provided that will be available in a standard select dropdown. It can be used to add quick
 * select items to a standard select field.
 *
 * WARNING: Multiselects are not supported at this time.
 *
 * WARNING: The quick pick items list must be distinct from the other items list, i.e. no duplicates.
 */
export function ButtonSelectField({
  name,
  label,
  quickPickItems,
  otherItems,
  minOtherItemsShown,
  disabled = false,
  labelSpace = 4,
  required = false,
  ...props
}: ButtonSelectFieldProps) {
  const {setValue} = useFormContext();
  const {field, fieldState} = useController({name});
  if (Array.isArray(field.value)) {
    throw new Error('ButtonSelectField cannot support multiselects at this time');
  }
  if (otherItems) {
    quickPickItems.forEach(item => {
      if (otherItems.find(x => x.value === item.value)) {
        throw new Error('ButtonSelectField quickPickItems and otherItems must be distinct lists');
      }
    });
  }

  // If the field is required default to first item in list
  useEffect(() => {
    if (required && quickPickItems.length > 0) {
      setValue(name, quickPickItems[0].value, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
    }
  }, [name, required, quickPickItems, setValue]);

  const selectRef = useRef<SelectRef>(null);

  const quickPickSelectionHandlers = useMemo(
    () =>
      quickPickItems.map(item => () => {
        if (item.value === field.value) {
          // Deselect value if not a required field
          if (!required) {
            setValue(name, '', {shouldValidate: false, shouldDirty: false, shouldTouch: false});
          }
          return;
        }
        setValue(name, item.value, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
        // Clear any selection in the select component
        selectRef.current?.clear();
      }),
    [name, quickPickItems, required, field.value, setValue, selectRef],
  );

  useEffect(() => {
    // Make sure the internal state of the select component is cleared when the form is cleared
    if (field.value === '') {
      selectRef.current?.clear();
    }
  }, [selectRef, field.value]);
  const onSelect = useCallback(
    (item: Item) => {
      setValue(name, item.value, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
    },
    [name, setValue],
  );
  const onRemove = useCallback(() => {
    setValue(name, '', {shouldValidate: false, shouldDirty: false, shouldTouch: false});
  }, [name, setValue]);

  const selectStyles = getSelectStyles(minOtherItemsShown, otherItems?.length, fieldState.error !== undefined);

  // RowMargin is the space between rows if the list of buttons wraps onto a second row. We subtract
  // it from top margin of the HStack to stop the first row of buttons from being offset down.
  const rowMargin = 5;

  return (
    <VStack width="100%" space={labelSpace} flex={1} flexGrow={1} bg={'white'} {...props}>
      <BodySmBlack>
        {label ?? name}
        {required && ' *'}
      </BodySmBlack>
      <HStack space={5} flexWrap="wrap" marginTop={-rowMargin} backgroundColor={fieldState.error && colorLookup('error.outline')} {...props}>
        {quickPickItems.map((item, index) => {
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
      {otherItems ? (
        <Select
          disabled={disabled}
          ref={selectRef}
          onSelect={onSelect}
          onRemove={onRemove}
          clearable={!required}
          styles={selectStyles}
          // Setting `scrollToSelectedOption` based on
          // https://github.com/MobileReality/react-native-select-pro/issues/230 Seems to fix
          // problem with items not showing up in list
          scrollToSelectedOption={false}
          theme="none"
          flatListProps={{
            // only works on Android, unfortunately
            persistentScrollbar: true,
          }}
          options={otherItems}
          placeholderText={'Other'}
          placeholderTextColor={colorLookup('text.secondary') as string}
        />
      ) : (
        ''
      )}
      {fieldState.error && <BodyXSm color={colorLookup('error.active')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
}

function getSelectStyles(minItemsShown?: number, itemsLength?: number, isError?: boolean): SelectStyles {
  const borderColor = colorLookup('border.base');
  return {
    select: {
      container: {
        borderWidth: 2,
        borderColor,
        borderRadius: 4,
        backgroundColor: isError ? colorLookup('error.outline') : undefined,
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
      minHeight: Math.min(minItemsShown ?? 10, itemsLength ?? 10) * 40,
    },
  };
}

ButtonSelectField.displayName = 'ButtonSelectField';
