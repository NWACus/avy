import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {Modal, TouchableOpacity} from 'react-native';

import {HStack, View, VStack} from 'components/core';
import {Title3Black} from 'components/text';
import {colorLookup} from 'theme';

interface AlertModalProps {
  isVisible: boolean;
  onDismiss: () => void;
  title?: string;
  titleAlign?: 'left' | 'center';
  showCloseButton?: boolean;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

const backdropStyle = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 24,
} as const;

const cardStyle = {
  backgroundColor: colorLookup('white'),
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 340,
} as const;

export const AlertModalActions: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <View mt={20} alignItems="stretch">
    <VStack space={8}>{children}</VStack>
  </View>
);

export const AlertModal: React.FC<AlertModalProps> = ({isVisible, onDismiss, title, titleAlign = 'left', showCloseButton = false, header, children}) => {
  const titleElement = title ? <Title3Black textAlign={titleAlign}>{title}</Title3Black> : null;

  return (
    <Modal transparent statusBarTranslucent visible={isVisible} animationType="fade" onRequestClose={onDismiss}>
      <View style={backdropStyle}>
        <VStack style={cardStyle}>
          {header}
          <VStack space={12}>
            {showCloseButton ? (
              <HStack width={'100%'} alignItems={'flex-start'} space={8}>
                <View flex={1}>{titleElement}</View>
                <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close-outline" size={24} color={colorLookup('text')} />
                </TouchableOpacity>
              </HStack>
            ) : (
              titleElement
            )}
            {children}
          </VStack>
        </VStack>
      </View>
    </Modal>
  );
};
