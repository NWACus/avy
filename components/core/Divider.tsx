import * as React from 'react';
import {merge} from 'lodash';

import {ViewStyle} from 'react-native';
import {View, ViewProps} from './View';

export interface DividerProps extends ViewProps {
  direction?: 'horizontal' | 'vertical';
  size?: number;
}

export const Divider: React.FC<DividerProps> = ({children, style: originalStyle = {}, direction = 'horizontal', size = 1, ...props}) => {
  const style: ViewStyle = {
    width: direction === 'horizontal' ? '100%' : size,
    height: direction === 'vertical' ? '100%' : size,
    flex: 1,
  };
  merge(style, originalStyle);
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};
