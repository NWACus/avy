import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {ViewProps, VStack} from 'components/core';
import {BodyXSmBlack} from 'components/text';
import React from 'react';
import {useController} from 'react-hook-form';
import {colorLookup} from 'theme';

interface Item<T> {
  value: T;
  label: string;
}

interface SwitchFieldProps<T> extends ViewProps {
  name: string;
  label: string;
  items: Item<T>[];
}

export function SwitchField<T>({name, label, items, ...props}: SwitchFieldProps<T>) {
  const {field} = useController({name});

  return (
    <VStack width="100%" space={4} {...props}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <SegmentedControl
        tintColor="white"
        activeFontStyle={{color: colorLookup('text') as string, fontSize: 16, fontFamily: 'Lato_400Regular'}}
        fontStyle={{color: colorLookup('text') as string, fontSize: 16, fontFamily: 'Lato_400Regular'}}
        values={items.map(i => i.label)}
        selectedIndex={Math.max(
          items.findIndex(i => i.value === field.value),
          0,
        )}
        onValueChange={(label: string) => {
          const value = items.find(i => i.label === label)?.value;
          if (value !== undefined) {
            field.onChange(value);
          }
        }}
      />
    </VStack>
  );
}
