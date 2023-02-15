import * as React from 'react';
import {merge} from 'lodash';

import {ViewStyle} from 'react-native';
import {View, ViewProps} from './View';
import {colorLookup} from 'theme';

export interface DividerProps extends ViewProps {
  direction?: 'horizontal' | 'vertical';
  size?: number;
}

export const Divider: React.FC<DividerProps> = React.memo(({children, style: originalStyle = {}, direction = 'horizontal', size = 1, ...props}) => {
  const style: ViewStyle = {
    width: direction === 'horizontal' ? '100%' : size,
    height: direction === 'vertical' ? '100%' : size,
    // Set a default background color if any of the bg props aren't passed.
    // If backgroundColor is set via the `style` prop, it will still take precedence
    backgroundColor: props.bg || props.bgColor || props.backgroundColor ? undefined : colorLookup('light.200'),
  };
  merge(style, originalStyle);
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
});
