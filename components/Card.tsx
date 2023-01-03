import React, {PropsWithChildren, ReactNode, useCallback} from 'react';
import {TouchableOpacity} from 'react-native';
import {Box, IBoxProps, Divider, VStack} from 'native-base';

export interface CardProps extends IBoxProps {
  header?: ReactNode;
  onPress?: () => void;
  borderRadius?: number;
  borderColor?: string;
}

export const Card: React.FunctionComponent<PropsWithChildren<CardProps>> = ({header, onPress, borderColor, borderRadius, children, ...boxProps}) => {
  const pressHandler = useCallback(() => onPress?.(), [onPress]);

  return (
    <Box {...boxProps}>
      <TouchableOpacity onPress={pressHandler}>
        <Box bg="white" borderWidth="2" borderRadius={borderRadius ?? 8} borderColor={borderColor ?? 'light.200'} p="4">
          <VStack space="2">
            <>{header}</>
            <Divider orientation="horizontal" bg="light.200" />
            <>{children}</>
          </VStack>
        </Box>
      </TouchableOpacity>
    </Box>
  );
};
