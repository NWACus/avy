import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {StyleSheet} from 'react-native';

import {Button} from 'components/content/Button';
import {VStack} from 'components/core';
import {Body, BodySemibold, Title3Semibold} from 'components/text';
import {colorLookup} from 'theme';

interface GeneralNoticeBannerProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  buttonTitle: string;
  onPress: () => void;
}

export const GeneralNoticeBanner: React.FC<GeneralNoticeBannerProps> = ({iconName, title, subtitle, buttonTitle, onPress}) => (
  <VStack style={styles.banner} space={12}>
    <VStack alignItems="center" space={4}>
      <Ionicons name={iconName} size={24} color={colorLookup('text')} />
      <Title3Semibold textAlign="center">{title}</Title3Semibold>
      <Body textAlign="center">{subtitle}</Body>
    </VStack>
    <Button buttonStyle="primary" onPress={onPress}>
      <BodySemibold>{buttonTitle}</BodySemibold>
    </Button>
  </VStack>
);

const styles = StyleSheet.create({
  banner: {
    padding: 16,
    borderWidth: 1,
    borderColor: colorLookup('primary.border'),
    borderRadius: 8,
    backgroundColor: colorLookup('notice.banner.general'),
  },
});
