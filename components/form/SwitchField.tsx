import {ViewProps, VStack} from 'components/core';
import {BodyXSmBlack} from 'components/text';
import React from 'react';
import {useController} from 'react-hook-form';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {colorLookup} from 'theme';

interface SwitchFieldProps extends ViewProps {
  name: string;
  label: string;
  items: string[];
}

export const SwitchField: React.FC<SwitchFieldProps> = ({name, label, items, ...props}) => {
  const {
    field: {value, onChange},
  } = useController({name});

  return (
    <VStack width="100%" space={4} {...props}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <SegmentedControl
        fontStyle={{color: colorLookup('text') as string, fontSize: 16, fontFamily: 'Lato_400Regular'}}
        values={items}
        selectedIndex={Math.max(items.indexOf(value), 0)}
        onChange={event => {
          onChange(items[event.nativeEvent.selectedSegmentIndex]);
        }}
      />
    </VStack>
  );
};
