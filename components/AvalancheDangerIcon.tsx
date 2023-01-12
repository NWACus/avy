import React from 'react';
import {Image, ImageSourcePropType, ImageStyle} from 'react-native';

import {DangerLevel} from 'types/nationalAvalancheCenter';

export interface AvalancheDangerIconProps {
  style: ImageStyle;
  level: DangerLevel;
}

const icons: Record<DangerLevel, ImageSourcePropType> = {
  [DangerLevel.GeneralInformation]: require('../assets/danger-icons/0.png'),
  [DangerLevel.None]: require('../assets/danger-icons/0.png'),
  [DangerLevel.Low]: require('../assets/danger-icons/1.png'),
  [DangerLevel.Moderate]: require('../assets/danger-icons/2.png'),
  [DangerLevel.Considerable]: require('../assets/danger-icons/3.png'),
  [DangerLevel.High]: require('../assets/danger-icons/4.png'),
  [DangerLevel.Extreme]: require('../assets/danger-icons/5.png'),
};

const sizes = Object.keys(icons).reduce((accum, key) => {
  accum[key] = Image.resolveAssetSource(icons[key]);
  return accum;
}, {});

interface Size {
  width: number;
  height: number;
}

export const iconSize = (dangerLevel: DangerLevel): Size => sizes[dangerLevel];

export const AvalancheDangerIcon: React.FunctionComponent<AvalancheDangerIconProps> = ({style, level}: AvalancheDangerIconProps) => {
  if (level === null) {
    level = DangerLevel.None;
  }

  const actualStyle: ImageStyle = {...style};
  actualStyle.width = undefined;
  actualStyle.aspectRatio = sizes[level].width / sizes[level].height;
  return <Image style={actualStyle} source={icons[level]} />;
};
