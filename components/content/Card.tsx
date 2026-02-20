import React, {PropsWithChildren, ReactNode, useCallback, useEffect, useState} from 'react';

import {ColorValue, TouchableOpacity, ViewStyle} from 'react-native';
import Collapsible from 'react-native-collapsible';

import Ionicons from '@expo/vector-icons/Ionicons';

import {Divider, HStack, View, ViewProps, VStack} from 'components/core';
import {usePostHog} from 'posthog-react-native';
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

const pressableStyle: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.2,
  shadowRadius: 1.41,

  elevation: 2,
} as const;

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
        <View bg="white" borderWidth={borderWidth ?? 2} borderRadius={borderRadius ?? 8} borderColor={borderColor ?? 'light.300'} p={16} style={onPress && {...pressableStyle}}>
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

export interface EditDeleteCardProps extends ViewProps {
  header?: ReactNode;
  onDeletePress: () => void;
  onEditPress?: () => void;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: ColorValue;
  noDivider?: boolean;
  noInternalSpace?: boolean;
}

export const EditDeleteCard: React.FunctionComponent<PropsWithChildren<EditDeleteCardProps>> = ({
  header,
  onEditPress,
  onDeletePress,
  borderColor,
  borderRadius,
  borderWidth,
  noDivider,
  noInternalSpace,
  children,
  ...boxProps
}) => {
  const onEditHandler = useCallback(() => {
    onEditPress?.();
  }, [onEditPress]);
  const onDeleteHandler = useCallback(() => onDeletePress(), [onDeletePress]);

  return (
    <View {...boxProps}>
      <View bg="white" borderWidth={borderWidth ?? 2} borderRadius={borderRadius ?? 8} borderColor={borderColor ?? 'light.300'} p={16}>
        <VStack space={noInternalSpace ? 0 : 8}>
          <HStack justifyContent="space-between">
            <>{header}</>
            <HStack space={4}>
              {onEditPress && (
                <Ionicons.Button
                  size={16}
                  name="pencil-outline"
                  color="rgba(0, 0, 0, 0.8)"
                  backgroundColor="white"
                  iconStyle={{marginRight: 0}}
                  style={{textAlign: 'center'}}
                  onPress={onEditHandler}
                />
              )}

              <Ionicons.Button
                size={16}
                name="trash-outline"
                color="rgba(0, 0, 0, 0.8)"
                backgroundColor="white"
                iconStyle={{marginRight: 0}}
                style={{textAlign: 'center'}}
                onPress={onDeleteHandler}
              />
            </HStack>
          </HStack>
          {noDivider || <Divider />}
          <>{children}</>
        </VStack>
      </View>
    </View>
  );
};

export interface CollapsibleCardProps extends CardProps {
  identifier: string;
  noDivider?: boolean;
  startsCollapsed: boolean;
}

export const CollapsibleCard: React.FunctionComponent<PropsWithChildren<CollapsibleCardProps>> = ({identifier, startsCollapsed, header, children, noDivider, ...props}) => {
  const [isCollapsed, setIsCollapsed] = useState(startsCollapsed);
  const textColor = colorLookup('text');
  const pressHandler = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);
  const postHog = usePostHog();
  useEffect(() => {
    if (postHog && identifier && isCollapsed !== startsCollapsed) {
      // capture the even when the user decided to interact with the card, don't send something without interaction
      postHog.capture('card', {identifier: identifier, isCollapsed: isCollapsed});
    }
  }, [identifier, postHog, isCollapsed, startsCollapsed]);

  return (
    <Card
      {...props}
      noDivider
      noInternalSpace
      header={
        <TouchableOpacity onPress={pressHandler}>
          <HStack justifyContent="space-between" alignItems="center">
            {header}
            <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} color={textColor} backgroundColor="white" size={24} />
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
