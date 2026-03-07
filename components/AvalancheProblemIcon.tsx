import {Logger} from 'browser-bunyan';
import React from 'react';
import {ActivityIndicator, Image, ImageResolvedAssetSource, ImageSourcePropType, ImageStyle} from 'react-native';

import {QueryClient} from '@tanstack/react-query';
import ImageCache, {useCachedImageURI} from 'hooks/useCachedImageURI';
import {AvalancheProblemType} from 'types/nationalAvalancheCenter';

export interface AvalancheProblemIconProps {
  problem: AvalancheProblemType;
}

const icons: Record<AvalancheProblemType, ImageSourcePropType> = {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */
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

const sizes: Record<AvalancheProblemType, ImageResolvedAssetSource> = {
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports */

  [AvalancheProblemType.DryLoose]: Image.resolveAssetSource(require('../assets/problem-icons/DryLoose.png')),
  [AvalancheProblemType.StormSlab]: Image.resolveAssetSource(require('../assets/problem-icons/StormSlab.png')),
  [AvalancheProblemType.WindSlab]: Image.resolveAssetSource(require('../assets/problem-icons/WindSlab.png')),
  [AvalancheProblemType.PersistentSlab]: Image.resolveAssetSource(require('../assets/problem-icons/PersistentSlab.png')),
  [AvalancheProblemType.DeepPersistentSlab]: Image.resolveAssetSource(require('../assets/problem-icons/DeepPersistentSlab.png')),
  [AvalancheProblemType.WetLoose]: Image.resolveAssetSource(require('../assets/problem-icons/WetLoose.png')),
  [AvalancheProblemType.WetSlab]: Image.resolveAssetSource(require('../assets/problem-icons/WetSlab.png')),
  [AvalancheProblemType.CorniceFall]: Image.resolveAssetSource(require('../assets/problem-icons/CorniceFall.png')),
  [AvalancheProblemType.Glide]: Image.resolveAssetSource(require('../assets/problem-icons/Glide.png')),
};

export const AvalancheProblemIcon: React.FunctionComponent<AvalancheProblemIconProps> = ({problem}: AvalancheProblemIconProps) => {
  const {data: uri} = useCachedImageURI(Image.resolveAssetSource(icons[problem]).uri);
  if (!uri) {
    return <ActivityIndicator />;
  }
  const style: ImageStyle = {};

  // Tell the image to flex into the size of its parent:
  style.width = undefined;
  style.height = undefined;
  style.resizeMode = 'contain';
  style.flex = 1;
  style.aspectRatio = sizes[problem].width / sizes[problem].height;

  return <Image style={style} source={{uri: uri}} />;
};

export const preloadAvalancheProblemIcons = async (queryClient: QueryClient, logger: Logger) => {
  return Promise.all([
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/DryLoose.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/StormSlab.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/WindSlab.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/PersistentSlab.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/DeepPersistentSlab.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/WetLoose.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/WetSlab.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/CorniceFall.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/problem-icons/Glide.png')).uri),
  ]);
};
