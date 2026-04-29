import Ionicons from '@expo/vector-icons/Ionicons';
import {NetworkImageState} from 'components/content/carousel/NetworkImage';
import {Center} from 'components/core';
import React, {useCallback, useEffect} from 'react';
import {ImageStyle, StyleProp, StyleSheet, TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme/colors';

interface PDFThumbnailProps {
  width: number;
  height: number;
  index: number;
  imageStyle?: StyleProp<ImageStyle>;
  onPress?: (index: number) => void;
  onStateChange?: (index: number, state: NetworkImageState) => void;
}

const pdfThumbnailStyle = {borderRadius: 16, borderColor: colorLookup('light.300'), borderWidth: 1, backgroundColor: colorLookup('light.100')};

export const PDFThumbnail: React.FC<PDFThumbnailProps> = ({width, height, index, imageStyle, onPress, onStateChange}) => {
  useEffect(() => {
    if (onStateChange) {
      onStateChange(index, 'success');
    }
  }, [index, onStateChange]);

  const onPressHandler = useCallback(() => onPress && onPress(index), [index, onPress]);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPressHandler} disabled={!onPress}>
      <Center width={width} height={height} style={StyleSheet.flatten([pdfThumbnailStyle, imageStyle])}>
        <Ionicons name="document-text" size={Math.min(64, height / 2)} color={colorLookup('warning.700')} />
      </Center>
    </TouchableOpacity>
  );
};
