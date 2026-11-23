import SegmentedControl from '@expo/ui/community/segmented-control';
import {ViewProps, VStack} from 'components/core';
import {FieldLabel, HelpText} from 'components/form/FieldLabel';
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
  helpText?: HelpText;
}

export function SwitchField<T>({name, label, items, disabled, helpText, ...props}: SwitchFieldProps<T>) {
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
      {label && <FieldLabel label={label} helpText={helpText} />}
      <SegmentedControl
        tintColor={Platform.OS === 'ios' ? 'white' : (colorLookup('blue.100') as string)}
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
