import {merge} from 'lodash';
import * as React from 'react';

import {View, ViewProps} from 'components/core/View';
import {ViewStyle} from 'react-native';

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
        .filter(child => child != null) // we only render (and optionally add space between) non-null children
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
