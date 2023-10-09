import React from 'react';

import * as _ from 'lodash';

import {StyleSheet} from 'react-native';
import Svg, {Path, SvgProps} from 'react-native-svg';

import Color from 'color';

import {AvalancheDangerForecast, DangerLevel} from 'types/nationalAvalancheCenter';

export const colorFor = (danger: DangerLevel | null | undefined): Color => {
  switch (danger) {
    case DangerLevel.Extreme:
      return Color('rgb(35, 31, 32)');
    case DangerLevel.High:
      return Color('rgb(237, 28, 36)');
    case DangerLevel.Considerable:
      return Color('rgb(247, 148, 30)');
    case DangerLevel.Moderate:
      return Color('rgb(255, 242, 0)');
    case DangerLevel.Low:
      return Color('rgb(80, 184, 72)');
    case DangerLevel.None:
    case DangerLevel.GeneralInformation:
    default:
      return Color('rgb(147, 149, 152)');
  }
};

export interface AvalancheDangerTriangleProps extends SvgProps {
  forecast: AvalancheDangerForecast;
}

export const AvalancheDangerTriangle: React.FunctionComponent<AvalancheDangerTriangleProps> = ({forecast, ...props}) => {
  return (
    <Svg
      {..._.merge(props, {style: styles.triangle})}
      viewBox={'0 0 168 173'}
      fillRule={'evenodd'}
      clipRule={'evenodd'}
      strokeLinecap={'round'}
      strokeLinejoin={'round'}
      strokeMiterlimit={1.5}>
      <Path d="M110.669 55H57.3103L83.9995 0L110.669 55Z" fill={colorFor(forecast.upper).string()} strokeWidth={0} />
      <Path d="M112.5 59H55.5L28.5 114H139.5L112.5 59Z" fill={colorFor(forecast.middle).string()} strokeWidth={0} />
      <Path d="M141 118H27L0 173H168L141 118Z" fill={colorFor(forecast.lower).string()} strokeWidth={0} />
    </Svg>
  );
};

const styles = StyleSheet.create({
  triangle: {
    position: 'absolute',
    height: '100%',
    aspectRatio: 168 / 173,
  },
});
