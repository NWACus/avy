import {View} from 'components/core';
import React, {PropsWithChildren} from 'react';
import {useWatch} from 'react-hook-form';
import Collapsible from 'react-native-collapsible';

interface ConditionalProps<T> {
  name: string;
  value: T;
  space?: number;
}

export function Conditional<T>({name, value, space = 0, children}: PropsWithChildren<ConditionalProps<T>>) {
  const formValue = useWatch<Record<string, string>>({name});
  const collapsed = formValue !== value;
  return (
    <View pb={collapsed ? 0 : space}>
      <Collapsible collapsed={collapsed}>{children}</Collapsible>
    </View>
  );
}
