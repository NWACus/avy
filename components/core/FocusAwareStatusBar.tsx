import {useIsFocused} from '@react-navigation/native';
import * as React from 'react';
import {StatusBar, StatusBarProps} from 'react-native';

// h/t https://reactnavigation.org/docs/status-bar/
export function FocusAwareStatusBar(props: StatusBarProps) {
  const isFocused = useIsFocused();

  return isFocused ? <StatusBar {...props} /> : null;
}
