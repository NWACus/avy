import React, {PropsWithChildren, ReactNode, useCallback, useState} from 'react';

import Collapsible from 'react-native-collapsible';
import {ColorValue, TouchableOpacity} from 'react-native';

import {FontAwesome} from '@expo/vector-icons';

import {colorLookup} from 'theme';
import {Divider, HStack, View, ViewProps, VStack} from 'components/core';

export interface CardProps extends ViewProps {
  header?: ReactNode;
  onPress?: () => void;
  borderRadius?: number;
  borderColor?: ColorValue;
  noDivider?: boolean;
  noInternalSpace?: boolean;
}

export const Card: React.FunctionComponent<PropsWithChildren<CardProps>> = ({header, onPress, borderColor, borderRadius, noDivider, noInternalSpace, children, ...boxProps}) => {
  const pressHandler = useCallback(() => onPress?.(), [onPress]);

  return (
    <View {...boxProps}>
      <TouchableOpacity onPress={pressHandler} disabled={!onPress}>
        <View bg="white" borderWidth={2} borderRadius={borderRadius ?? 8} borderColor={borderColor ?? 'light.200'} p={16}>
          <VStack space={noInternalSpace ? 0 : 8}>
            <>{header}</>
            {noDivider || <Divider direction="horizontal" bg="light.200" />}
            <>{children}</>
          </VStack>
        </View>
      </TouchableOpacity>
    </View>
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
          <Divider direction="horizontal" bg="light.200" />
          <>{children}</>
        </VStack>
      </Collapsible>
    </Card>
  );
};