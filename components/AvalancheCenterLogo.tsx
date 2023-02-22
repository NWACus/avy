import {QueryClient} from '@tanstack/react-query';
import ImageCache, {useCachedImageURI} from 'hooks/useCachedImageURI';
import React, {ReactElement} from 'react';
import {ActivityIndicator, Image, ImageResolvedAssetSource, ImageStyle} from 'react-native';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterLogoProps {
  style: ImageStyle;
  avalancheCenterId: string;
}

export const AvalancheCenterLogo: React.FunctionComponent<AvalancheCenterLogoProps> = ({style, avalancheCenterId}: AvalancheCenterLogoProps) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const source: Record<string, ImageResolvedAssetSource> = {
    ['BTAC']: Image.resolveAssetSource(require('../assets/logos/BTAC.png')),
    ['CNFAIC']: Image.resolveAssetSource(require('../assets/logos/CNFAIC.png')),
    ['FAC']: Image.resolveAssetSource(require('../assets/logos/FAC.png')),
    ['GNFAC']: Image.resolveAssetSource(require('../assets/logos/GNFAC.png')),
    ['IPAC']: Image.resolveAssetSource(require('../assets/logos/IPAC.png')),
    ['NWAC']: Image.resolveAssetSource(require('../assets/logos/NWAC.png')),
    ['MSAC']: Image.resolveAssetSource(require('../assets/logos/MSAC.png')),
    ['MWAC']: Image.resolveAssetSource(require('../assets/logos/MWAC.png')),
    ['PAC']: Image.resolveAssetSource(require('../assets/logos/PAC.png')),
    ['SNFAC']: Image.resolveAssetSource(require('../assets/logos/SNFAC.png')),
    ['SAC']: Image.resolveAssetSource(require('../assets/logos/SAC.png')),
    ['WCMAC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    ['CAIC']: Image.resolveAssetSource(require('../assets/logos/CAIC.jpg')),
    ['COAA']: Image.resolveAssetSource(require('../assets/logos/COAA.png')),
    ['CBAC']: Image.resolveAssetSource(require('../assets/logos/CBAC.png')),
    ['ESAC']: Image.resolveAssetSource(require('../assets/logos/ESAC.png')),
    ['WAC']: Image.resolveAssetSource(require('../assets/logos/WAC.png')),
  };

  const {data: uri} = useCachedImageURI(source[avalancheCenterId].uri);
  if (!uri) {
    return <ActivityIndicator style={style} />;
  }

  const images: Record<string, {(s: ImageStyle): ReactElement}> = {
    ['BTAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CNFAIC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['FAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['GNFAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['IPAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['NWAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['MSAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['MWAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['PAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['SNFAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['SAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['WCMAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CAIC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['COAA']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CBAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['ESAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['WAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
  };
  /* eslint-enable @typescript-eslint/no-var-requires */
  const actualStyle: ImageStyle = {...style};
  if (actualStyle.height) {
    actualStyle.width = undefined;
  } else {
    actualStyle.height = undefined;
  }
  actualStyle.aspectRatio = source[avalancheCenterId].width / source[avalancheCenterId].height;
  return images[avalancheCenterId](actualStyle);
};

export const preloadAvalancheCenterLogo = async (queryClient: QueryClient, avalancheCenter: AvalancheCenterID) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  switch (avalancheCenter) {
    case 'BTAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/BTAC.png')).uri);
    case 'CNFAIC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/CNFAIC.png')).uri);
    case 'FAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/FAC.png')).uri);
    case 'GNFAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/GNFAC.png')).uri);
    case 'IPAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/IPAC.png')).uri);
    case 'NWAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/NWAC.png')).uri);
    case 'MSAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/MSAC.png')).uri);
    case 'MWAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/MWAC.png')).uri);
    case 'PAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/PAC.png')).uri);
    case 'SNFAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/SNFAC.png')).uri);
    case 'SAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/SAC.png')).uri);
    case 'WCMAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    case 'CAIC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/CAIC.jpg')).uri);
    case 'COAA':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/COAA.png')).uri);
    case 'CBAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/CBAC.png')).uri);
    case 'ESAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/ESAC.png')).uri);
    case 'WAC':
      return ImageCache.prefetch(queryClient, Image.resolveAssetSource(require('../assets/logos/WAC.png')).uri);
  }
  const invalid: never = avalancheCenter;
  throw new Error(`Unknown avalanche center: ${JSON.stringify(invalid)}`);
};
