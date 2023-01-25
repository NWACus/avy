import React, {ReactElement} from 'react';
import {Image, ImageStyle} from 'react-native';
import {AvalancheCenterID} from '../types/nationalAvalancheCenter';

export interface AvalancheCenterLogoProps {
  style: ImageStyle;
  avalancheCenterId: string;
}

interface size {
  width: number;
  height: number;
}

export const AvalancheCenterLogo: React.FunctionComponent<AvalancheCenterLogoProps> = ({style, avalancheCenterId}: AvalancheCenterLogoProps) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const sizes: Record<string, size> = {
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
    ['WCMAC']: Image.resolveAssetSource(require('../assets/logos/WCMAC.svg')),
    ['CAIC']: Image.resolveAssetSource(require('../assets/logos/CAIC.jpg')),
    ['COAA']: Image.resolveAssetSource(require('../assets/logos/COAA.png')),
    ['CBAC']: Image.resolveAssetSource(require('../assets/logos/CBAC.png')),
    ['ESAC']: Image.resolveAssetSource(require('../assets/logos/ESAC.png')),
    ['WAC']: Image.resolveAssetSource(require('../assets/logos/WAC.png')),
  };

  const images: Record<string, {(s: ImageStyle): ReactElement}> = {
    ['BTAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/BTAC.png')} />;
    },
    ['CNFAIC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/CNFAIC.png')} />;
    },
    ['FAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/FAC.png')} />;
    },
    ['GNFAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/GNFAC.png')} />;
    },
    ['IPAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/IPAC.png')} />;
    },
    ['NWAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/NWAC.png')} />;
    },
    ['MSAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/MSAC.png')} />;
    },
    ['MWAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/MWAC.png')} />;
    },
    ['PAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/PAC.png')} />;
    },
    ['SNFAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/SNFAC.png')} />;
    },
    ['SAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/SAC.png')} />;
    },
    ['WCMAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/WCMAC.svg')} />;
    },
    ['CAIC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/CAIC.jpg')} />;
    },
    ['COAA']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/COAA.png')} />;
    },
    ['CBAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/CBAC.png')} />;
    },
    ['ESAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/ESAC.png')} />;
    },
    ['WAC']: (s: ImageStyle) => {
      return <Image style={s} source={require('../assets/logos/WAC.png')} />;
    },
  };
  /* eslint-enable @typescript-eslint/no-var-requires */
  const actualStyle: ImageStyle = {...style};
  if (actualStyle.height) {
    actualStyle.width = undefined;
  } else {
    actualStyle.height = undefined;
  }
  actualStyle.aspectRatio = sizes[avalancheCenterId].width / sizes[avalancheCenterId].height;
  return images[avalancheCenterId](actualStyle);
};

export const preloadAvalancheCenterLogo = async (avalancheCenter: AvalancheCenterID) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  switch (avalancheCenter) {
    case 'BTAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/BTAC.png')).uri);
    case 'CNFAIC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/CNFAIC.png')).uri);
    case 'FAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/FAC.png')).uri);
    case 'GNFAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/GNFAC.png')).uri);
    case 'IPAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/IPAC.png')).uri);
    case 'NWAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/NWAC.png')).uri);
    case 'MSAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/MSAC.png')).uri);
    case 'MWAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/MWAC.png')).uri);
    case 'PAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/PAC.png')).uri);
    case 'SNFAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/SNFAC.png')).uri);
    case 'SAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/SAC.png')).uri);
    case 'WCMAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/WCMAC.svg')).uri);
    case 'CAIC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/CAIC.jpg')).uri);
    case 'COAA':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/COAA.png')).uri);
    case 'CBAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/CBAC.png')).uri);
    case 'ESAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/ESAC.png')).uri);
    case 'WAC':
      return Image.prefetch(Image.resolveAssetSource(require('../assets/logos/WAC.png')).uri);
  }
  const invalid: never = avalancheCenter;
  throw new Error(`Unknown avalanche center: ${invalid}`);
};
