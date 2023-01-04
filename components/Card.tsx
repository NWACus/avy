import React, {PropsWithChildren, ReactNode, useCallback, useState} from 'react';

import Collapsible from 'react-native-collapsible';
import {TouchableOpacity} from 'react-native';

import {FontAwesome} from '@expo/vector-icons';

import {Box, IBoxProps, Divider, VStack, HStack, useToken} from 'native-base';

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
      <TouchableOpacity onPress={pressHandler} disabled={!onPress}>
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

export interface CollapsibleCardProps extends CardProps {
  startsCollapsed: boolean;
}

export const CollapsibleCard: React.FunctionComponent<PropsWithChildren<CollapsibleCardProps>> = ({startsCollapsed, header, children, ...props}) => {
  const [isCollapsed, setIsCollapsed] = useState(startsCollapsed);
  const [textColor] = useToken('colors', ['darkText']);

  return (
    <Card
      {...props}
      header={
        <HStack justifyContent="space-between" alignItems="center">
          {header}
          <FontAwesome.Button name={isCollapsed ? 'angle-down' : 'angle-up'} color={textColor} backgroundColor="white" onPress={() => setIsCollapsed(!isCollapsed)} />
        </HStack>
      }>
      <Collapsible collapsed={isCollapsed} renderChildrenCollapsed>
        <>{children}</>
      </Collapsible>
    </Card>
  );
};
