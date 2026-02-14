import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {ViewProps, VStack} from 'components/core';
import {FieldLabel} from 'components/form/FieldLabel';
import React, {useCallback} from 'react';
import {useController} from 'react-hook-form';
import {Platform} from 'react-native';
import {colorLookup} from 'theme';

interface Item<T> {
  value: T;
  label: string;
}

interface SwitchFieldProps<T> extends ViewProps {
  name: string;
  label?: string;
  items: Item<T>[];
  disabled?: boolean;
}

export function SwitchField<T>({name, label, items, disabled, ...props}: SwitchFieldProps<T>) {
  const {field} = useController({name});
  const onValueChange = useCallback(
    (label: string) => {
      const value = items.find(i => i.label === label)?.value;
      if (value !== undefined) {
        field.onChange(value);
      }
    },
    [items, field],
  );

  return (
    <VStack width="100%" space={4} {...props}>
      {label && <FieldLabel label={label} />}
      <SegmentedControl
        tintColor="white"
        activeFontStyle={{
          color: colorLookup('text') as string,
          fontSize: 16,
          fontFamily: Platform.select({
            android: 'Lato_400Regular',
            ios: 'Lato-Regular',
          }),
        }}
        fontStyle={{
          color: colorLookup('text') as string,
          fontSize: 16,
          fontFamily: Platform.select({
            android: 'Lato_400Regular',
            ios: 'Lato-Regular',
          }),
        }}
        values={items.map(i => i.label)}
        selectedIndex={Math.max(
          items.findIndex(i => i.value === field.value),
          0,
        )}
        onValueChange={onValueChange}
        appearance="light"
        enabled={!disabled}
      />
    </VStack>
  );
}
