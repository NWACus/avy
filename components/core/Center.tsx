import {merge} from 'lodash';
import * as React from 'react';

import {View, ViewProps} from 'components/core/View';
import {Animated, ViewStyle} from 'react-native';

const baseStyle: ViewStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const Center: React.FC<ViewProps> = ({children, style: originalStyle = {}, ...props}) => {
  const style = {};
  merge(style, baseStyle, originalStyle);
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};
Center.displayName = 'Center';

export const AnimatedCenter = Animated.createAnimatedComponent(Center);
AnimatedCenter.displayName = 'AnimatedCenter';
