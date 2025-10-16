import React from 'react';
import {ColorValue} from 'react-native';
import Svg, {Path} from 'react-native-svg';

export const NACAvalancheIcon: React.FunctionComponent<{size: number; color: string | ColorValue}> = ({size, color}) => {
  return (
    <Svg height={size} width={size} viewBox="0 0 1000 1043" color={color}>
      <Path d="M131 162l692 723H131V162zm142 64q-3-4-3-8.5t3-8.5q3-4 8-5t9 2l424 278-95 105-346-363zm223 233l3-6 3-5q15-24 41-34.5t52-2.5q6-25 29-42t52-16.5q29 .5 51.5 18T755 413q26-7 52.5 4t40.5 35q14 24 10 52t-24 45q12 12 16.5 35.5T852 634q-3 26-13 42-15 25-42 40-29 17-50 8l-4-3-247-262z" />
    </Svg>
  );
};
