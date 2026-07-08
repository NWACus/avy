import Ionicons from '@expo/vector-icons/Ionicons';
import {HStack, View, VStack} from 'components/core';
import {Body} from 'components/text';
import React, {ReactNode} from 'react';
import {TouchableWithoutFeedback} from 'react-native';
import {colorLookup} from 'theme';

export const BaseToast: React.FunctionComponent<{
  icon: ReactNode;
  borderColor: string;
  content: string;
  onPress?: () => void;
}> = ({icon, borderColor, content, onPress}) => {
  const toast = (
    <VStack mx={24} borderWidth={1} borderRadius={6} borderColor={borderColor} backgroundColor={'white'}>
      <HStack width={'100%'}>
        <View width={8} height="100%" bg={borderColor} borderTopLeftRadius={6} borderBottomLeftRadius={6} pb={0} />
        <HStack px={16} my={16} space={12} flex={1}>
          {icon}
          <View flex={1}>
            <Body>{content}</Body>
          </View>
          {onPress && onPress.name !== 'noop' && <Ionicons name="close-outline" size={24} color={colorLookup('muted.700')} />}
        </HStack>
      </HStack>
    </VStack>
  );
  if (onPress && onPress.name !== 'noop') {
    return <TouchableWithoutFeedback onPress={onPress}>{toast}</TouchableWithoutFeedback>;
  }

  return toast;
};

export const SuccessToast: React.FunctionComponent<{content: string; onPress?: () => void}> = ({...props}) => {
  return <BaseToast icon={<Ionicons name="checkmark-circle-outline" size={24} color="#006D23" />} borderColor={'#9ED696'} {...props} />;
};

export const InfoToast: React.FunctionComponent<{content: string; onPress?: () => void}> = ({...props}) => {
  return <BaseToast icon={<Ionicons name="information-circle-outline" size={24} color="#5A657C" />} borderColor={'#CFD9E0'} {...props} />;
};

export const ActionToast: React.FunctionComponent<{content: string; onPress?: () => void}> = ({...props}) => {
  return <BaseToast icon={<Ionicons name="information-circle-outline" size={24} color="#0059C8" />} borderColor={'#98CBFF'} {...props} />;
};

export const ErrorToast: React.FunctionComponent<{content: string; onPress?: () => void}> = ({...props}) => {
  return <BaseToast icon={<Ionicons name="warning-outline" size={24} color="#DB3832" />} borderColor={'#FF3141'} {...props} />;
};

export const WarningToast: React.FunctionComponent<{content: string; onPress?: () => void}> = ({...props}) => {
  return <BaseToast icon={<Ionicons name="warning-outline" size={24} color="#EA983F" />} borderColor={'#EA983F'} {...props} />;
};
