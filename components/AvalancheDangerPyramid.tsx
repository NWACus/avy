import React from 'react';

import * as _ from 'lodash';

import Svg, {Path, SvgProps} from 'react-native-svg';
import {StyleSheet} from 'react-native';

import Color from 'color';

import {AvalancheDangerForecast, DangerLevel} from 'types/nationalAvalancheCenter';

export const colorFor = (danger: DangerLevel): Color => {
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

const shadow: Color = Color('rgb(30, 35, 38)');

export interface AvalancheDangerPyramidProps extends SvgProps {
  forecast: AvalancheDangerForecast;
}
export const AvalancheDangerPyramid: React.FunctionComponent<AvalancheDangerPyramidProps> = ({forecast, ...props}) => {
  return (
    <Svg viewBox={'0 0 250 300'} {..._.merge(props, {style: styles.pyramid})}>
      <Path d="M31.504,210l175,0l43.496,90l-250,0l31.504,-90Z" fill={colorFor(forecast.lower).string()} strokeWidth={0} />
      <Path d="M204.087,205l-170.833,0l31.503,-90l95.834,0l43.496,90Z" fill={colorFor(forecast.middle).string()} strokeWidth={0} />
      <Path d="M158.174,110l-91.666,0l38.504,-110l53.162,110Z" fill={colorFor(forecast.upper).string()} strokeWidth={0} />
      <Path
        d="M87.504,210l-7.504,90l-80,0l31.504,-90l56,0Zm7.92,-95l-7.504,90l-54.666,0l31.503,-90l30.667,0Zm-28.916,-5l38.504,-110l-9.171,110l-29.333,0Z"
        fill={shadow.string()}
        opacity={0.1}
      />
    </Svg>
  );
};

const outline: Color = Color('rgb(204, 204, 204)');

export const AvalancheDangerTriangle: React.FunctionComponent<AvalancheDangerForecast> = (forecast: AvalancheDangerForecast) => {
  return (
    <Svg style={styles.triangle} viewBox={'0 0 160 140'} fillRule={'evenodd'} clipRule={'evenodd'} strokeLinecap={'round'} strokeLinejoin={'round'} strokeMiterlimit={1.5}>
      <Path d="M30.222,95.2l99.556,0l21.333,37.8l-142.222,0l21.333,-37.8Z" fill={colorFor(forecast.lower).string()} strokeWidth={0} />
      <Path d="M128.593,93.1l-97.186,0l21.334,-37.8l54.518,0l21.334,37.8Z" fill={colorFor(forecast.middle).string()} strokeWidth={0} />
      <Path d="M106.074,53.2l-52.148,0l26.074,-46.2l26.074,46.2Z" fill={colorFor(forecast.upper).string()} strokeWidth={0} />
      <Path
        d="M77.387,5.329c0.532,-0.942 1.531,-1.525 2.613,-1.525c1.082,0 2.081,0.583 2.613,1.525c11.761,20.84 59.726,105.827 71.306,126.346c0.524,0.929 0.516,2.067 -0.022,2.988c-0.538,0.921 -1.524,1.487 -2.59,1.487c-23.343,0 -119.271,0 -142.614,0c-1.066,0 -2.052,-0.566 -2.59,-1.487c-0.538,-0.921 -0.546,-2.059 -0.022,-2.988c11.58,-20.519 59.545,-105.506 71.306,-126.346Z"
        fill={'none'}
        stroke={outline.string()}
        strokeWidth={'2.51px'}
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  pyramid: {
    position: 'absolute',
    height: '100%',
    aspectRatio: 250 / 300,
    left: '20%',
  },
  triangle: {
    position: 'absolute',
    height: '100%',
    aspectRatio: 160 / 140,
  },
});
