import {TouchableOpacity, View as RNView} from 'react-native';

import {Entypo} from '@expo/vector-icons';
import {HStack, View, ViewProps, VStack} from 'components/core';
import {Body, bodySize} from 'components/text';
import React, {useRef, useState} from 'react';
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
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [layout, setLayout] = useState<LayoutRectangle>({x: 0, y: 0, width: 0, height: 0});

  const onLayout = () => {
    // onLayout returns position relative to parent - we need position relative to screen
    ref.current?.measureInWindow((x, y, width, height) => {
      setLayout({x, y, width, height});
    });
  };

  return (
    <>
      <View ref={ref} borderColor={borderColor} borderWidth={2} borderRadius={4} p={8} flexDirection="column" justifyContent="center" onLayout={onLayout} {...props}>
        <TouchableOpacity
          onPress={() => {
            setDropdownVisible(!dropdownVisible);
          }}>
          <HStack justifyContent="space-between" alignItems="center">
            <Body>{selectedItem}</Body>
            <Entypo name={dropdownVisible ? 'chevron-small-up' : 'chevron-small-down'} size={bodySize} color={colorLookup('text')} />
          </HStack>
        </TouchableOpacity>
      </View>
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
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
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setDropdownVisible(false);
                    onSelectionChange?.(item);
                  }}>
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
