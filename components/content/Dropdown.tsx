import {View as RNView, TouchableOpacity} from 'react-native';

import {Entypo} from '@expo/vector-icons';
import {HStack, View, ViewProps, VStack} from 'components/core';
import {Body} from 'components/text';
import {useToggle} from 'hooks/useToggle';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {LayoutRectangle, Modal, StyleSheet, TouchableWithoutFeedback} from 'react-native';
import {colorLookup} from 'theme';
import tinycolor from 'tinycolor2';

export interface DropdownProps extends ViewProps {
  items: string[];
  selectedItem: string;
  onSelectionChange?: (item: string) => void;
}

const borderColor = colorLookup('border.base');

export const Dropdown: React.FC<DropdownProps> = ({items, selectedItem, onSelectionChange, ...props}) => {
  const ref = useRef<RNView>(null);
  const [dropdownVisible, {off: hideDropdown, toggle: toggleDropdown}] = useToggle(false);
  const [layout, setLayout] = useState<LayoutRectangle>({x: 0, y: 0, width: 0, height: 0});

  // Every time through render, try to measure where we're at so that we can place the dropdown correctly.
  // This used to be done in onLayout, but that inconsistently missed layout changes.
  useEffect(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (x !== layout.x || y !== layout.y || width !== layout.width || height !== layout.height) {
        const newLayout = {x, y, width, height};
        setLayout(newLayout);
      }
    });
  });

  const selectionHandlers = useMemo(
    () =>
      Object.fromEntries(
        items.map(item => [
          item,
          () => {
            hideDropdown();
            onSelectionChange?.(item);
          },
        ]),
      ),
    [items, hideDropdown, onSelectionChange],
  );

  return (
    <>
      <TouchableOpacity onPress={toggleDropdown}>
        <View ref={ref} borderColor={borderColor} borderWidth={2} borderRadius={4} p={8} flexDirection="column" justifyContent="center" {...props}>
          <HStack justifyContent="space-between" alignItems="center">
            <Body>{selectedItem}</Body>
            <Entypo name={dropdownVisible ? 'chevron-small-up' : 'chevron-small-down'} size={32} style={{marginTop: -2.25}} color={colorLookup('text')} />
          </HStack>
        </View>
      </TouchableOpacity>
      <Modal visible={dropdownVisible} transparent animationType="none">
        <TouchableWithoutFeedback disabled={!dropdownVisible} onPress={hideDropdown}>
          <View style={{...StyleSheet.absoluteFillObject}}>
            <VStack
              bg="white"
              position="absolute"
              top={layout.y + layout.height}
              left={layout.x}
              width={layout.width}
              pb={2}
              borderColor={borderColor}
              borderWidth={2}
              borderTopWidth={0}
              borderBottomLeftRadius={4}
              borderBottomRightRadius={4}>
              {items.sort().map((item, index) => (
                <TouchableOpacity key={item} disabled={!dropdownVisible} onPress={selectionHandlers[item]}>
                  <View px={8} key={item} bg={item === selectedItem ? tinycolor(colorLookup('primary').toString()).setAlpha(0.1).toRgbString() : undefined}>
                    <View py={8} borderTopWidth={index > 0 ? 2 : 0} borderColor={borderColor}>
                      <Body key={item}>{item}</Body>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </VStack>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};
