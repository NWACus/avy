import {Button} from 'components/content/Button';
import {HStack, ViewProps} from 'components/core';
import {Body, BodyBlack, BodyXSm, BodyXSmBlack} from 'components/text';
import React, {useMemo} from 'react';

interface ButtonBarProps<T> extends ViewProps {
  items: {label: string; value: T}[];
  selectedItem: T;
  onSelectionChange: (item: T) => void;
  size?: 'small' | 'normal';
  disabled?: boolean;
  fullWidth?: boolean;
}

const LabelFonts = {
  small: {
    selected: BodyXSmBlack,
    unselected: BodyXSm,
  },
  normal: {
    selected: BodyBlack,
    unselected: Body,
  },
};

export function ButtonBar<T>({items, selectedItem, onSelectionChange, disabled = false, size = 'normal', fullWidth = false, ...props}: ButtonBarProps<T>) {
  const buttonCount = items.length;
  const pressHandlers = useMemo(() => {
    return items.map(item => () => onSelectionChange(item.value));
  }, [items, onSelectionChange]);
  return (
    <HStack space={0} {...props}>
      {items.map((item, index) => {
        const first = index === 0;
        const last = index === buttonCount - 1;
        const selected = item.value === selectedItem;
        const LabelFont = selected ? LabelFonts[size].selected : LabelFonts[size].unselected;
        return (
          <Button
            key={item.label}
            onPress={pressHandlers[index]}
            buttonStyle={selected ? 'primary' : 'normal'}
            minWidth={fullWidth ? `${100.0 / items.length}%` : undefined}
            px={24}
            py={4}
            borderWidth={1}
            borderBottomLeftRadius={first ? undefined : 0}
            borderTopRightRadius={last ? undefined : 0}
            borderBottomRightRadius={last ? undefined : 0}
            borderTopLeftRadius={first ? undefined : 0}
            borderRightWidth={last ? undefined : 0}
            disabled={disabled}>
            <LabelFont>{item.label}</LabelFont>
          </Button>
        );
      })}
    </HStack>
  );
}
