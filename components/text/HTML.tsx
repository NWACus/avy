import * as _ from 'lodash';
import React, {PropsWithChildren, useRef} from 'react';

import {Body} from 'components/text';
import Constants from 'expo-constants';
import {useToggle} from 'hooks/useToggle';
import {Platform, ScrollView, TouchableOpacity, useWindowDimensions} from 'react-native';
import {MixedStyleDeclaration, RenderHTMLConfigProvider, RenderHTMLSource, RenderHTMLSourceProps, TRenderEngineProvider} from 'react-native-render-html';
import {colorLookup} from 'theme';

const systemFonts = [
  ...Constants.systemFonts,
  ...Platform.select({
    android: [
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
    ],
    ios: [
      'Lato-HairlineItalic',
      'Lato-Hairline',
      'Lato-LightItalic',
      'Lato-Light',
      'Lato-Italic',
      'Lato-Regular',
      'Lato-BoldItalic',
      'Lato-Bold',
      'Lato-BlackItalic',
      'Lato-Black',
    ],
    macos: [],
    web: [],
    windows: [],
    native: [],
  }),
];

export interface HTMLRendererConfigProps {
  baseStyle?: MixedStyleDeclaration;
}

const baseStyleDefaults: MixedStyleDeclaration = {
  fontSize: 16,
  fontFamily: Platform.select({
    android: 'Lato_400Regular',
    ios: 'Lato-Regular',
  }),
  color: colorLookup('text'),
};

const tagsStylesDefaults = {
  strong: {
    fontFamily: Platform.select({
      android: 'Lato_700Bold',
      ios: 'Lato-Bold',
    }),
  },
  em: {
    fontFamily: Platform.select({
      android: 'Lato_400Regular_Italic',
      ios: 'Lato-Italic',
    }),
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
    const [showSource, {toggle: toggleSource}] = useToggle(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const html = _.get(props, ['source', 'html'], undefined);
    return (
      <TouchableOpacity activeOpacity={1} onLongPress={toggleSource}>
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
