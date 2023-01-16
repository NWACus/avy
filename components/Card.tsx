import React, {PropsWithChildren, ReactNode, useCallback, useState} from 'react';

import Collapsible from 'react-native-collapsible';
import {TouchableOpacity} from 'react-native';

import {FontAwesome} from '@expo/vector-icons';

import {Box, IBoxProps, Divider} from 'native-base';
import {colorLookup} from 'theme';
import {HStack, VStack} from 'components/core';

export interface CardProps extends IBoxProps {
  header?: ReactNode;
  onPress?: () => void;
  borderRadius?: number;
  borderColor?: string;
  noDivider?: boolean;
  noInternalSpace?: boolean;
}

export const Card: React.FunctionComponent<PropsWithChildren<CardProps>> = ({header, onPress, borderColor, borderRadius, noDivider, noInternalSpace, children, ...boxProps}) => {
  const pressHandler = useCallback(() => onPress?.(), [onPress]);

  return (
    <Box {...boxProps}>
      <TouchableOpacity onPress={pressHandler} disabled={!onPress}>
        <Box bg="white" borderWidth="2" borderRadius={borderRadius ?? 8} borderColor={borderColor ?? 'light.200'} p="4">
          <VStack space={noInternalSpace ? 0 : 8}>
            <>{header}</>
            {noDivider || <Divider orientation="horizontal" bg="light.200" />}
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
  const textColor = colorLookup('darkText');

  return (
    <Card
      {...props}
      noDivider
      noInternalSpace
      header={
        <TouchableOpacity onPress={() => setIsCollapsed(!isCollapsed)}>
          <HStack justifyContent="space-between" alignItems="center">
            {header}
            <FontAwesome name={isCollapsed ? 'angle-down' : 'angle-up'} color={textColor} backgroundColor="white" size={24} />
          </HStack>
        </TouchableOpacity>
      }>
      <Collapsible collapsed={isCollapsed} renderChildrenCollapsed>
        <VStack space={8} pt={8}>
          <Divider orientation="horizontal" bg="light.200" />
          <>{children}</>
        </VStack>
      </Collapsible>
    </Card>
  );
};
