import {HStack, View, ViewProps, VStack} from 'components/core';
import React, {useState} from 'react';
import {LayoutChangeEvent, LayoutRectangle, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback} from 'react-native';
import {Body, bodySize} from 'components/text';
import {colorLookup} from 'theme';
import tinycolor from 'tinycolor2';
import {AntDesign} from '@expo/vector-icons';

export interface DropdownProps extends ViewProps {
  items: string[];
  selectedItem: string;
  onSelectionChange?: (item: string) => void;
}

const borderColor = colorLookup('border.base');

export const Dropdown: React.FC<DropdownProps> = ({items, selectedItem, onSelectionChange, ...props}) => {
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [layout, setLayout] = useState<LayoutRectangle>({x: 0, y: 0, width: 0, height: 0});

  const onLayout = (event: LayoutChangeEvent) => {
    // onLayout returns position relative to parent - we need position relative to screen
    event.currentTarget.measureInWindow((x, y, width, height) => {
      setLayout({x, y, width, height});
    });
  };

  return (
    <>
      <View borderColor={borderColor} borderWidth={2} borderRadius={4} p={8} flexDirection="column" justifyContent="center" onLayout={onLayout} {...props}>
        <TouchableOpacity
          onPress={() => {
            setDropdownVisible(!dropdownVisible);
          }}>
          <HStack justifyContent="space-between" alignItems="center">
            <Body>{selectedItem}</Body>
            <AntDesign name={dropdownVisible ? 'up' : 'down'} size={bodySize} color={colorLookup('text')} />
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
                  <View px={8} key={item} bg={item === selectedItem ? tinycolor(colorLookup('primary')).setAlpha(0.1).toRgbString() : undefined}>
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
