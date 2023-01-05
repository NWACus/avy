import * as React from 'react';
import * as _ from 'lodash';

import {useToken} from 'native-base';
import {RenderHTML, RenderHTMLProps} from 'react-native-render-html';
import {useWindowDimensions} from 'react-native';
import Constants from 'expo-constants';

const systemFonts = [
  ...Constants.systemFonts,
  'Lato_100Thin',
  'Lato_100Thin_Italic',
  'Lato_300Light',
  'Lato_300Light_Italic',
  'Lato_400Regular',
  'Lato_400Regular_Italic',
  'Lato_700Bold',
  'Lato_700Bold_Italic',
  'Lato_900Black',
  'Lato_900Black_Italic',
];

export const HTMLRenderer: React.FunctionComponent<RenderHTMLProps> = props => {
  const {width: windowWidth} = useWindowDimensions();
  const [textColor] = useToken('colors', ['darkText']);
  const defaultProps: Partial<RenderHTMLProps> = {
    contentWidth: windowWidth,
    defaultTextProps: {
      style: {
        fontSize: 16,
      },
    },
    tagsStyles: {
      p: {
        fontFamily: 'Lato_400Regular',
        color: textColor,
      },
      strong: {
        fontFamily: 'Lato_700Bold',
      },
      em: {
        fontFamily: 'Lato_400Regular_Italic',
      },
    },
    systemFonts,
  };

  return <RenderHTML {..._.merge(defaultProps, props || {})} />;
};
