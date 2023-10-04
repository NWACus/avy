import React, {PropsWithChildren, ReactNode, useCallback, useState} from 'react';

import {ColorValue, TouchableOpacity} from 'react-native';
import Collapsible from 'react-native-collapsible';

import {FontAwesome} from '@expo/vector-icons';

import {Divider, HStack, View, ViewProps, VStack} from 'components/core';
import {colorLookup} from 'theme';

export interface CardProps extends ViewProps {
  header?: ReactNode;
  onPress?: () => void;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: ColorValue;
  noDivider?: boolean;
  noInternalSpace?: boolean;
}

export const Card: React.FunctionComponent<PropsWithChildren<CardProps>> = ({
  header,
  onPress,
  borderColor,
  borderRadius,
  borderWidth,
  noDivider,
  noInternalSpace,
  children,
  ...boxProps
}) => {
  const pressHandler = useCallback(() => onPress?.(), [onPress]);

  return (
    <View {...boxProps}>
      <TouchableOpacity onPress={pressHandler} disabled={!onPress}>
        <View bg="white" borderWidth={borderWidth ?? 2} borderRadius={borderRadius ?? 8} borderColor={borderColor ?? 'light.300'} p={16}>
          <VStack space={noInternalSpace ? 0 : 8}>
            <>{header}</>
            {noDivider || <Divider />}
            <>{children}</>
          </VStack>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export interface CollapsibleCardProps extends CardProps {
  noDivider?: boolean;
  startsCollapsed: boolean;
  collapsedStateChanged?: (collapsed: boolean) => void;
}

export const CollapsibleCard: React.FunctionComponent<PropsWithChildren<CollapsibleCardProps>> = ({
  startsCollapsed,
  collapsedStateChanged,
  header,
  children,
  noDivider,
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(startsCollapsed);
  const textColor = colorLookup('text');
  const pressHandler = useCallback(() => {
    setIsCollapsed(!isCollapsed);
    collapsedStateChanged?.(!isCollapsed);
  }, [isCollapsed, collapsedStateChanged]);

  return (
    <Card
      {...props}
      noDivider
      noInternalSpace
      header={
        <TouchableOpacity onPress={pressHandler}>
          <HStack justifyContent="space-between" alignItems="center">
            {header}
            <FontAwesome name={isCollapsed ? 'angle-down' : 'angle-up'} color={textColor} backgroundColor="white" size={24} />
          </HStack>
        </TouchableOpacity>
      }>
      <Collapsible collapsed={isCollapsed} renderChildrenCollapsed>
        <VStack space={8} pt={8}>
          {!noDivider && <Divider />}
          <>{children}</>
        </VStack>
      </Collapsible>
    </Card>
  );
};
