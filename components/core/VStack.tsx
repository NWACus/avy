import * as React from 'react';
import {merge} from 'lodash';

import {ViewStyle} from 'react-native';
import {View, ViewProps} from './View';

const baseStyle: ViewStyle = {
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
};

export interface VStackProps extends ViewProps {
  space?: number;
}

export const VStack: React.FC<VStackProps> = ({children: originalChildren, style: originalStyle = {}, space, ...props}) => {
  const style = {};
  merge(style, baseStyle, originalStyle);
  const children = (() => {
    if (typeof space === 'number') {
      return React.Children.toArray(originalChildren)
        .map((child, index) => (index > 0 ? [<View height={space} flex={0} key={`vstack-space-${index}`} />, child] : child))
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
