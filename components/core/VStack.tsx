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

export const VStack = React.forwardRef<RNView, VStackProps>(({children, style: originalStyle = {}, space, ...props}, ref) => {
  const style: ViewStyle = {
    rowGap: space,
  };
  merge(style, baseStyle, originalStyle);
  return (
    <View style={style} {...props} ref={ref}>
      {children}
    </View>
  );
});
VStack.displayName = 'VStack';
