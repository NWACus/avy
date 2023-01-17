import React from 'react';
import {Image, ImageSourcePropType, ImageStyle} from 'react-native';

import {AvalancheProblemType} from 'types/nationalAvalancheCenter';

export interface AvalancheProblemIconProps {
  problem: AvalancheProblemType;
}

const icons: Record<AvalancheProblemType, ImageSourcePropType> = {
  [AvalancheProblemType.DryLoose]: require('../assets/problem-icons/DryLoose.png'),
  [AvalancheProblemType.StormSlab]: require('../assets/problem-icons/StormSlab.png'),
  [AvalancheProblemType.WindSlab]: require('../assets/problem-icons/WindSlab.png'),
  [AvalancheProblemType.PersistentSlab]: require('../assets/problem-icons/PersistentSlab.png'),
  [AvalancheProblemType.DeepPersistentSlab]: require('../assets/problem-icons/DeepPersistentSlab.png'),
  [AvalancheProblemType.WetLoose]: require('../assets/problem-icons/WetLoose.png'),
  [AvalancheProblemType.WetSlab]: require('../assets/problem-icons/WetSlab.png'),
  [AvalancheProblemType.CorniceFall]: require('../assets/problem-icons/CorniceFall.png'),
  [AvalancheProblemType.Glide]: require('../assets/problem-icons/Glide.png'),
};

const sizes = Object.keys(icons).reduce((accum, key) => {
  accum[key] = Image.resolveAssetSource(icons[key]);
  return accum;
}, {});

export const AvalancheProblemIcon: React.FunctionComponent<AvalancheProblemIconProps> = ({problem}: AvalancheProblemIconProps) => {
  const style: ImageStyle = {};

  // Tell the image to flex into the size of its parent:
  style.width = undefined;
  style.height = undefined;
  style.resizeMode = 'contain';
  style.flex = 1;
  style.aspectRatio = sizes[problem].width / sizes[problem].height;

  return <Image style={style} source={icons[problem]} />;
};
