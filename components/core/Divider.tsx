import {merge} from 'lodash';
import * as React from 'react';

import {View, ViewProps} from 'components/core/View';
import {ViewStyle} from 'react-native';
import {colorLookup} from 'theme';

export interface DividerProps extends ViewProps {
  direction?: 'horizontal' | 'vertical';
  size?: number;
}

export const Divider: React.FC<DividerProps> = ({children, style: originalStyle = {}, direction = 'horizontal', size = 1, ...props}) => {
  const style: ViewStyle = {
    width: direction === 'horizontal' ? '100%' : size,
    height: direction === 'vertical' ? '100%' : size,
    // Set a default background color if any of the bg props aren't passed.
    // If backgroundColor is set via the `style` prop, it will still take precedence
    backgroundColor: props.bg || props.backgroundColor ? undefined : colorLookup('light.300'),
  };
  merge(style, originalStyle);
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};
