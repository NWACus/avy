import React, {ReactElement} from 'react';
import {Image, ImageStyle} from 'react-native';

export interface AvalancheCenterLogoProps {
  style: ImageStyle;
  center_id: string;
}

interface size {
  width: number;
  height: number;
}

export const AvalancheCenterLogo: React.FunctionComponent<AvalancheCenterLogoProps> = ({style, center_id}: AvalancheCenterLogoProps) => {
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
  let actualStyle: ImageStyle = {...style};
  if (actualStyle.height) {
    actualStyle.width = undefined;
  } else {
    actualStyle.height = undefined;
  }
  actualStyle.aspectRatio = sizes[center_id].width / sizes[center_id].height;
  return images[center_id](actualStyle);
};
