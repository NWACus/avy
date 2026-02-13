import {QueryClient} from '@tanstack/react-query';
import {Logger} from 'browser-bunyan';
import ImageCache, {useCachedImageURI} from 'hooks/useCachedImageURI';
import React, {ReactElement} from 'react';
import {ActivityIndicator, DimensionValue, Image, ImageResizeMode, ImageResolvedAssetSource, ImageStyle} from 'react-native';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface AvalancheCenterLogoStyle {
  resizeMode?: ImageResizeMode | undefined;
  width?: DimensionValue | undefined;
  height?: DimensionValue | undefined;
  marginTop?: DimensionValue | undefined;
  flex?: number | undefined;
  flexGrow?: number | undefined;
}

export interface AvalancheCenterLogoProps {
  style: AvalancheCenterLogoStyle;
  avalancheCenterId: AvalancheCenterID;
}

export const AvalancheCenterLogo: React.FunctionComponent<AvalancheCenterLogoProps> = ({style, avalancheCenterId}: AvalancheCenterLogoProps) => {
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports */

  const source: Record<AvalancheCenterID, ImageResolvedAssetSource> = {
    ['BAC']: Image.resolveAssetSource(require('../assets/logos/BAC.png')),
    ['BTAC']: Image.resolveAssetSource(require('../assets/logos/BTAC.png')),
    ['CBAC']: Image.resolveAssetSource(require('../assets/logos/CBAC.png')),
    ['CNFAIC']: Image.resolveAssetSource(require('../assets/logos/CNFAIC.png')),
    ['COAA']: Image.resolveAssetSource(require('../assets/logos/COAA.png')),
    ['ESAC']: Image.resolveAssetSource(require('../assets/logos/ESAC.png')),
    ['FAC']: Image.resolveAssetSource(require('../assets/logos/FAC.png')),
    ['HAC']: Image.resolveAssetSource(require('../assets/logos/HAC.png')),
    ['HPAC']: Image.resolveAssetSource(require('../assets/logos/HPAC.png')),
    ['GNFAC']: Image.resolveAssetSource(require('../assets/logos/GNFAC.png')),
    ['IPAC']: Image.resolveAssetSource(require('../assets/logos/IPAC.png')),
    ['KPAC']: Image.resolveAssetSource(require('../assets/logos/KPAC.png')),
    ['MSAC']: Image.resolveAssetSource(require('../assets/logos/MSAC.png')),
    ['MWAC']: Image.resolveAssetSource(require('../assets/logos/MWAC.png')),
    ['NWAC']: Image.resolveAssetSource(require('../assets/logos/NWAC.png')),
    ['PAC']: Image.resolveAssetSource(require('../assets/logos/PAC.png')),
    ['SAC']: Image.resolveAssetSource(require('../assets/logos/SAC.png')),
    ['SNFAC']: Image.resolveAssetSource(require('../assets/logos/SNFAC.png')),
    ['TAC']: Image.resolveAssetSource(require('../assets/logos/TAC.png')),
    ['VAC']: Image.resolveAssetSource(require('../assets/logos/VAC.png')),
    ['WAC']: Image.resolveAssetSource(require('../assets/logos/WAC.png')),
    ['WCMAC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    // The following are unsupported
    ['CAIC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    ['UAC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    ['SOAIX']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    ['EWYAIX']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    ['EARAC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    ['CAC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
    ['CAAC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.png')),
  };

  const {data: uri} = useCachedImageURI(source[avalancheCenterId].uri);
  if (!uri) {
    const {resizeMode: _, ...viewStyle} = style;
    return <ActivityIndicator style={viewStyle} />;
  }

  const images: Record<AvalancheCenterID, {(s: ImageStyle): ReactElement}> = {
    ['BAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['BTAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CBAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CNFAIC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['COAA']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['ESAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['FAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['HAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['HPAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['GNFAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['IPAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['KPAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['MSAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['MWAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['NWAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['PAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['SAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['SNFAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['TAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['VAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['WAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['WCMAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CAIC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['UAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['SOAIX']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['EWYAIX']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['EARAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
    ['CAAC']: (s: ImageStyle) => {
      return <Image style={s} source={{uri: uri}} />;
    },
  };
  const actualStyle: ImageStyle = {...style};
  if (actualStyle.resizeMode !== 'contain') {
    if (actualStyle.height) {
      actualStyle.width = undefined;
    } else {
      actualStyle.height = undefined;
    }
  }
  actualStyle.aspectRatio = source[avalancheCenterId].width / source[avalancheCenterId].height;
  return images[avalancheCenterId](actualStyle);
};

export const preloadAvalancheCenterLogo = async (queryClient: QueryClient, logger: Logger, avalancheCenter: AvalancheCenterID) => {
  switch (avalancheCenter) {
    case 'BAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/BAC.png')).uri);
    case 'BTAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/BTAC.png')).uri);
    case 'CBAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/CBAC.png')).uri);
    case 'CNFAIC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/CNFAIC.png')).uri);
    case 'COAA':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/COAA.png')).uri);
    case 'ESAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/ESAC.png')).uri);
    case 'FAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/FAC.png')).uri);
    case 'GNFAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/GNFAC.png')).uri);
    case 'HAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/HAC.png')).uri);
    case 'HPAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/HPAC.png')).uri);
    case 'IPAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/IPAC.png')).uri);
    case 'KPAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/KPAC.png')).uri);
    case 'MSAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/MSAC.png')).uri);
    case 'MWAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/MWAC.png')).uri);
    case 'NWAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/NWAC.png')).uri);
    case 'PAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/PAC.png')).uri);
    case 'SAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/SAC.png')).uri);
    case 'SNFAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/SNFAC.png')).uri);
    case 'TAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/TAC.png')).uri);
    case 'VAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/VAC.png')).uri);
    case 'WAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WAC.png')).uri);
    case 'WCMAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    // The following are unsupported
    case 'CAIC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    case 'UAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    case 'SOAIX':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    case 'EWYAIX':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    case 'EARAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    case 'CAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
    case 'CAAC':
      return ImageCache.prefetch(queryClient, logger, Image.resolveAssetSource(require('../assets/logos/WCMAC.png')).uri);
  }
  const invalid: never = avalancheCenter;
  throw new Error(`Unable to load logo, unknown avalanche center: ${JSON.stringify(invalid)}`);
};
