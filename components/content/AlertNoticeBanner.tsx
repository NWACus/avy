import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';

import {HStack, VStack} from 'components/core';
import {BodySm, BodySmSemibold} from 'components/text';
import {colorLookup} from 'theme';

interface AlertNoticeBannerProps {
  body: string;
  iconName: keyof typeof Ionicons.glyphMap;
  actionTitle: string;
  onAction: () => void;
}

export const AlertNoticeBanner: React.FC<AlertNoticeBannerProps> = ({body, iconName, actionTitle, onAction}) => (
  <HStack style={styles.banner} space={12} alignItems="flex-start">
    <Ionicons name={iconName} size={20} color={colorLookup('error.color-primary')} />
    <VStack flex={1} space={8} alignItems="flex-start">
      <BodySm color="error.color-primary">{body}</BodySm>
      <TouchableOpacity onPress={onAction} accessibilityRole="button" hitSlop={8}>
        <BodySmSemibold color="error.color-primary" style={styles.action}>
          {actionTitle}
        </BodySmSemibold>
      </TouchableOpacity>
    </VStack>
  </HStack>
);

const styles = StyleSheet.create({
  banner: {
    padding: 16,
    borderWidth: 1,
    borderColor: colorLookup('error.border'),
    borderRadius: 8,
    backgroundColor: colorLookup('notice.banner.alert'),
  },
  action: {
    textDecorationLine: 'underline',
  },
});
