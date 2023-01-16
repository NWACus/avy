import * as React from 'react';
import {merge} from 'lodash';

import {ViewStyle} from 'react-native';
import {View, ViewProps} from './View';

const baseStyle: ViewStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const Center: React.FC<ViewProps> = React.memo(({children, style: originalStyle = {}, ...props}) => {
  const style = {};
  merge(style, baseStyle, originalStyle);
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
});
