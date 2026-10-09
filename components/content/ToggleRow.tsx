import React from 'react';
import {StyleSheet} from 'react-native';

import {Toggle} from 'components/content/Toggle';
import {HStack, VStack} from 'components/core';
import {Body, BodySm} from 'components/text';
import {colorLookup} from 'theme';

export const TOGGLE_ROW_MIN_HEIGHT = 56;

interface ToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({title, subtitle, value, onValueChange, disabled}) => (
  <HStack style={styles.row} space={12} alignItems="center">
    <VStack flex={1} space={2}>
      <Body numberOfLines={2}>{title}</Body>
      {subtitle && <BodySm color="text.tertiary">{subtitle}</BodySm>}
    </VStack>
    <Toggle value={value} onValueChange={onValueChange} disabled={disabled} accessibilityLabel={title} />
  </HStack>
);

const styles = StyleSheet.create({
  row: {
    minHeight: TOGGLE_ROW_MIN_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colorLookup('border.base'),
    borderRadius: 8,
    backgroundColor: colorLookup('white'),
  },
});
