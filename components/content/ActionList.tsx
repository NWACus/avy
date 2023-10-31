import {Entypo} from '@expo/vector-icons';
import {HStack, View, ViewProps, VStack} from 'components/core';
import {Body} from 'components/text';
import React from 'react';
import {TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme';

interface Action<T> {
  label: string;
  data: T;
  action?: (action: {label: string; data: T}) => void;
  // Someday, might be nice to support nesting
  // children?: Action[];
}

export interface ActionListProps<T> extends ViewProps {
  actions: Action<T>[];
  header?: React.ReactNode;
}

export function ActionList<T>({actions, header, ...props}: ActionListProps<T>) {
  return (
    <VStack {...props}>
      {header && (
        <View borderBottomWidth={1} borderColor={colorLookup('light.300')} py={10}>
          {header}
        </View>
      )}
      {actions.map(({label, data, action}, index) => (
        <TouchableOpacity onPress={() => action && action({label, data})} key={label}>
          <HStack borderBottomWidth={index < actions.length - 1 ? 1 : 0} borderColor={colorLookup('light.300')} py={10} pr={8} justifyContent="space-between">
            <Body style={{flex: 1, flexGrow: 1}}>{label}</Body>
            <Entypo name={'chevron-small-right'} color={colorLookup('light.300')} size={24} />
          </HStack>
        </TouchableOpacity>
      ))}
    </VStack>
  );
}
