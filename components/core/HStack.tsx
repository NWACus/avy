import * as React from 'react';
import {merge} from 'lodash';

import {ViewStyle} from 'react-native';
import {View, ViewProps} from './View';

const baseStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
};

export interface HStackProps extends ViewProps {
  space?: number;
}

export const HStack: React.FC<HStackProps> = ({children: originalChildren, style: originalStyle = {}, space, ...props}) => {
  const style = {};
  merge(style, baseStyle, originalStyle);
  const children = (() => {
    if (typeof space === 'number') {
      return React.Children.toArray(originalChildren)
        .map((child, index) => (index > 0 ? [<View width={space} flex={0} key={`hstack-space-${index}`} />, child] : child))
        .flat();
    }
    return originalChildren;
  })();
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};
