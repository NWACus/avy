import React, {PropsWithChildren, useState} from 'react';
import * as _ from 'lodash';

import {MixedStyleDeclaration, RenderHTMLConfigProvider, RenderHTMLSource, RenderHTMLSourceProps, TRenderEngineProvider} from 'react-native-render-html';
import {Platform, ScrollView, TouchableOpacity, useWindowDimensions} from 'react-native';
import Constants from 'expo-constants';
import {Body} from 'components/text';
import {colorLookup} from 'theme';

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

export interface HTMLRendererConfigProps {
  baseStyle?: MixedStyleDeclaration;
}

export const HTMLRendererConfig: React.FunctionComponent<PropsWithChildren<HTMLRendererConfigProps>> = ({baseStyle = {}, children}) => {
  const textColor = colorLookup('darkText');
  return (
    <TRenderEngineProvider
      baseStyle={{
        fontSize: 16,
        fontFamily: 'Lato_400Regular',
        color: textColor,
        ...baseStyle,
      }}
      tagsStyles={{
        strong: {
          fontFamily: 'Lato_700Bold',
        },
        em: {
          fontFamily: 'Lato_400Regular_Italic',
        },
      }}
      systemFonts={systemFonts}>
      <RenderHTMLConfigProvider enableExperimentalBRCollapsing enableExperimentalMarginCollapsing>
        {children}
      </RenderHTMLConfigProvider>
    </TRenderEngineProvider>
  );
};

export const HTML: React.FunctionComponent<RenderHTMLSourceProps> = props => {
  const {width: windowWidth} = useWindowDimensions();
  const defaultProps: Partial<RenderHTMLSourceProps> = {
    contentWidth: windowWidth,
  };

  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [showSource, setShowSource] = useState(false);
    const html = _.get(props, ['source', 'html'], undefined);
    return (
      <TouchableOpacity activeOpacity={1} onLongPress={() => setShowSource(!showSource)}>
        {showSource && html ? (
          <ScrollView>
            <Body fontFamily={Platform.select({ios: 'Courier New', android: 'monospace'})}>{html}</Body>
          </ScrollView>
        ) : (
          <RenderHTMLSource {..._.merge(defaultProps, props || {})} />
        )}
      </TouchableOpacity>
    );
  }

  return <RenderHTMLSource {..._.merge(defaultProps, props || {})} />;
};
