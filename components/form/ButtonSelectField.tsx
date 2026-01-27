import {Button} from 'components/content/Button';
import {HStack, VStack, ViewProps} from 'components/core';
import {Body, BodyBlack, BodySmBlack, BodyXSm} from 'components/text';
import React, {useMemo} from 'react';
import {useController, useFormContext} from 'react-hook-form';
import {colorLookup} from 'theme';

interface Item {
  label: string;
  value: string;
}

interface ButtonSelectFieldProps extends ViewProps {
  name: string;
  label?: string;
  items: Item[];
  disabled?: boolean;
  labelSpace?: number;
}

/**
 * This component renders a horizontal stack of buttons for the user to select from. It's an
 * alternative to SelectField when you don't want a dropdown, good for quick selects.
 */
export function ButtonSelectField({name, label, items, disabled = false, labelSpace = 4, ...props}: ButtonSelectFieldProps) {
  const {setValue} = useFormContext();
  const {field, fieldState} = useController({name});

  const selectionHandlers = useMemo(
    () =>
      items.map(item => () => {
        if (item.value === field.value) {
          // Deselect value
          setValue(name, '', {shouldValidate: false, shouldDirty: false, shouldTouch: false});
          return;
        }
        setValue(name, item.value, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
      }),
    [name, items, field.value, setValue],
  );

  // RowMargin is the space between rows if the list of buttons wraps onto a second row. We subtract
  // it from top margin of the HStack to stop the first row of buttons from being offset down.
  const rowMargin = 5;

  return (
    <VStack width="100%" space={labelSpace} flex={1} flexGrow={1} bg={'white'} {...props}>
      <BodySmBlack>{label ?? name}</BodySmBlack>
      <HStack space={5} flexWrap="wrap" marginTop={-rowMargin} {...props}>
        {items.map((item, index) => {
          const selected = item.value === field.value;
          const LabelFont = selected ? BodyBlack : Body;
          return (
            <Button
              key={item.label}
              onPress={selectionHandlers[index]}
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
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
}

ButtonSelectField.displayName = 'ButtonSelectField';
