import {Logger} from 'browser-bunyan';
import React from 'react';
import {ActivityIndicator, Image, ImageResolvedAssetSource, ImageSourcePropType, ImageStyle} from 'react-native';

import {QueryClient} from '@tanstack/react-query';
import ImageCache, {useCachedImageURI} from 'hooks/useCachedImageURI';
import {DangerLevel} from 'types/nationalAvalancheCenter';

export interface AvalancheDangerIconProps {
  style: ImageStyle;
  level: DangerLevel | null;
}

const icons: Record<DangerLevel, ImageSourcePropType> = {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */
  [DangerLevel.GeneralInformation]: require('../assets/danger-icons/0.png'),
  [DangerLevel.None]: require('../assets/danger-icons/0.png'),
  [DangerLevel.Low]: require('../assets/danger-icons/1.png'),
  [DangerLevel.Moderate]: require('../assets/danger-icons/2.png'),
  [DangerLevel.Considerable]: require('../assets/danger-icons/3.png'),
  [DangerLevel.High]: require('../assets/danger-icons/4.png'),
  [DangerLevel.Extreme]: require('../assets/danger-icons/5.png'),
};

const sizes: Record<DangerLevel, ImageResolvedAssetSource> = {
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports */
  [DangerLevel.GeneralInformation]: Image.resolveAssetSource(require('../assets/danger-icons/0.png')),
  [DangerLevel.None]: Image.resolveAssetSource(require('../assets/danger-icons/0.png')),
  [DangerLevel.Low]: Image.resolveAssetSource(require('../assets/danger-icons/1.png')),
  [DangerLevel.Moderate]: Image.resolveAssetSource(require('../assets/danger-icons/2.png')),
  [DangerLevel.Considerable]: Image.resolveAssetSource(require('../assets/danger-icons/3.png')),
  [DangerLevel.High]: Image.resolveAssetSource(require('../assets/danger-icons/4.png')),
  [DangerLevel.Extreme]: Image.resolveAssetSource(require('../assets/danger-icons/5.png')),
};

interface Size {
  width: number;
  height: number;
}

export const iconSize = (dangerLevel: DangerLevel | null): Size => (dangerLevel ? sizes[dangerLevel] : sizes[DangerLevel.None]);

export const AvalancheDangerIcon: React.FunctionComponent<AvalancheDangerIconProps> = ({style, level}: AvalancheDangerIconProps) => {
  if (level === null) {
    level = DangerLevel.None;
  }
  const {data: uri} = useCachedImageURI(Image.resolveAssetSource(icons[level]).uri);
  if (!uri) {
    return <ActivityIndicator />;
  }

  const actualStyle: ImageStyle = {...style};
  actualStyle.width = undefined;
  actualStyle.aspectRatio = sizes[level].width / sizes[level].height;
  return <Image style={actualStyle} source={{uri: uri}} />;
};

export const preloadAvalancheDangerIcons = async (queryClient: QueryClient, logger: Logger) => {
  return Promise.all([
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/danger-icons/0.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/danger-icons/1.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/danger-icons/2.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/danger-icons/3.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/danger-icons/4.png')).uri),
    ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/danger-icons/5.png')).uri),
  ]);
};
