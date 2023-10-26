import {isUndefined, merge, omitBy} from 'lodash';
import * as React from 'react';

import {Text, TextProps, TextStyle} from 'react-native';

import {decode} from 'html-entities';

import {colorLookup} from 'theme';

export interface TextWrapperProps extends TextProps {
  color?: TextStyle['color'];
  fontFamily?: TextStyle['fontFamily'];
  fontSize?: TextStyle['fontSize'];
  fontStyle?: TextStyle['fontStyle'];
  letterSpacing?: TextStyle['letterSpacing'];
  lineHeight?: TextStyle['lineHeight'];
  textAlign?: TextStyle['textAlign'];
  textTransform?: TextStyle['textTransform'];
  unescapeHTMLEntities?: boolean;
  translate?: boolean;
}

const translations = [{from: /SNFAC/g, to: 'SAC'}];

function replaceCenterIds(input: string): string {
  return translations.reduce((acc, {from, to}) => {
    return acc.replace(from, to);
  }, input);
}

const TextWrapper: React.FC<TextWrapperProps> = ({
  color,
  fontFamily,
  fontSize,
  fontStyle,
  letterSpacing,
  lineHeight,
  textAlign,
  textTransform,
  children,
  unescapeHTMLEntities = false,
  translate: translateCenterIds = true,
  ...props
}) => {
  const style = omitBy(
    {
      color: color ? colorLookup(color) : color,
      fontFamily,
      fontSize,
      letterSpacing,
      lineHeight,
      textAlign,
      textTransform,
    },
    isUndefined,
  );
  if (style.fontFamily && fontStyle === 'italic') {
    style.fontFamily = String(style.fontFamily) + '_Italic';
  }
  const stringTransforms: ((input: string) => string)[] = [];
  if (unescapeHTMLEntities) {
    stringTransforms.push(decode);
  }
  if (translateCenterIds) {
    stringTransforms.push(replaceCenterIds);
  }
  return (
    <Text {...merge({}, props, {style})}>
      {React.Children.map(children, child => {
        if (typeof child === 'string') {
          return stringTransforms.reduce((acc, transform) => transform(acc), child);
        } else {
          return child;
        }
      })}
    </Text>
  );
};

// TODO figure out letter spacing values - what *are* the react native units?
export const FeatureTitleBlack: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={32} lineHeight={34} fontFamily="Lato_900Black" letterSpacing={0.4} {...props} />
);

export const Title1: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={28} lineHeight={34} fontFamily="Lato_400Regular" letterSpacing={0.38} {...props} />
);
export const Title1Semibold: React.FunctionComponent<TextWrapperProps> = props => <Title1 fontFamily="Lato_700Bold" {...props} />;
export const Title1Black: React.FunctionComponent<TextWrapperProps> = props => <Title1 fontFamily="Lato_900Black" {...props} />;

export const Title3: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={20} lineHeight={24} fontFamily="Lato_400Regular" letterSpacing={-0.45} {...props} />
);
export const Title3Semibold: React.FunctionComponent<TextWrapperProps> = props => <Title3 fontFamily="Lato_700Bold" {...props} />;
export const Title3Black: React.FunctionComponent<TextWrapperProps> = props => <Title3 fontFamily="Lato_900Black" {...props} />;

export const bodySize = 16;
export const Body: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={bodySize} lineHeight={22} fontFamily="Lato_400Regular" letterSpacing={-0.43} {...props} />
);
export const BodySemibold: React.FunctionComponent<TextWrapperProps> = props => <Body fontFamily="Lato_700Bold" {...props} />;
export const BodyBlack: React.FunctionComponent<TextWrapperProps> = props => <Body fontFamily="Lato_900Black" {...props} />;

export const bodySmSize = 14;
export const BodySm: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={14} lineHeight={21} fontFamily="Lato_400Regular" letterSpacing={-0.31} {...props} />
);
export const BodySmSemibold: React.FunctionComponent<TextWrapperProps> = props => <BodySm fontFamily="Lato_700Bold" {...props} />;
export const BodySmBlack: React.FunctionComponent<TextWrapperProps> = props => <BodySm fontFamily="Lato_900Black" {...props} />;

export const bodyXSmSize = 12;
export const BodyXSm: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={bodyXSmSize} lineHeight={18} fontFamily="Lato_400Regular" letterSpacing={-0.31} {...props} />
);
export const BodyXSmMedium: React.FunctionComponent<TextWrapperProps> = props => <BodyXSm fontFamily="Lato_400Regular" {...props} />;
export const BodyXSmBlack: React.FunctionComponent<TextWrapperProps> = props => <BodyXSm fontFamily="Lato_900Black" {...props} />;

export const allCapsSmLineHeight = 18;
export const AllCapsSm: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={13} lineHeight={allCapsSmLineHeight} fontFamily="Lato_400Regular" letterSpacing={-0.08} {...merge({style: {textTransform: 'uppercase'}}, props)} />
);
export const AllCapsSmBlack: React.FunctionComponent<TextWrapperProps> = props => <AllCapsSm fontFamily="Lato_900Black" {...props} />;

export const Caption1: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper fontSize={12} lineHeight={16} fontFamily="Lato_400Regular" letterSpacing={-0.31} {...props} />
);
export const Caption1Semibold: React.FunctionComponent<TextWrapperProps> = props => <Caption1 fontFamily="Lato_700Bold" {...props} />;
export const Caption1Black: React.FunctionComponent<TextWrapperProps> = props => <Caption1 fontFamily="Lato_900Black" {...props} />;
