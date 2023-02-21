import * as _ from 'lodash';
import React, {PropsWithChildren, useRef, useState} from 'react';

import {Body} from 'components/text';
import Constants from 'expo-constants';
import {Platform, ScrollView, TouchableOpacity, useWindowDimensions} from 'react-native';
import {MixedStyleDeclaration, RenderHTMLConfigProvider, RenderHTMLSource, RenderHTMLSourceProps, TRenderEngineProvider} from 'react-native-render-html';
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

const baseStyleDefaults: MixedStyleDeclaration = {
  fontSize: 16,
  fontFamily: 'Lato_400Regular',
  color: colorLookup('text'),
};

const tagsStylesDefaults = {
  strong: {
    fontFamily: 'Lato_700Bold',
  },
  em: {
    fontFamily: 'Lato_400Regular_Italic',
  },
};

export const HTMLRendererConfig: React.FunctionComponent<PropsWithChildren<HTMLRendererConfigProps>> = ({baseStyle: baseStyleProp = {}, children}) => {
  const baseStyle = useRef({
    ...baseStyleDefaults,
    ...baseStyleProp,
  }).current;

  return (
    <TRenderEngineProvider baseStyle={baseStyle} tagsStyles={tagsStylesDefaults} systemFonts={systemFonts}>
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
