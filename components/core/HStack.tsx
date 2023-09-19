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

export const HStack: React.FC<HStackProps> = ({children, style: originalStyle = {}, space, ...props}) => {
  const style: ViewStyle = {
    columnGap: space,
  };
  merge(style, baseStyle, originalStyle);
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};
