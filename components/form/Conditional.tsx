import React, {PropsWithChildren} from 'react';
import {useWatch} from 'react-hook-form';
import Collapsible from 'react-native-collapsible';

interface ConditionalProps<T> {
  name: string;
  value: T;
}

export function Conditional<T>({name, value, children}: PropsWithChildren<ConditionalProps<T>>) {
  const formValue = useWatch({name});

  return <Collapsible collapsed={formValue !== value}>{children}</Collapsible>;
}
