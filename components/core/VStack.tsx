import {merge} from 'lodash';
import * as React from 'react';

import {View, ViewProps} from 'components/core/View';
import {View as RNView, ViewStyle} from 'react-native';

const baseStyle: ViewStyle = {
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
};

export interface VStackProps extends ViewProps {
  space?: number;
}

export const VStack = React.memo(
  React.forwardRef<RNView, VStackProps>(({children: originalChildren, style: originalStyle = {}, space, ...props}, ref) => {
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
      <View style={style} {...props} ref={ref}>
        {children}
      </View>
    );
  }),
);
