import {isUndefined, merge, omitBy} from 'lodash';
import * as React from 'react';

import {Platform, Text, TextProps, TextStyle} from 'react-native';

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
}

const TextWrapper: React.FC<TextWrapperProps> = React.memo(
  ({color, fontFamily, fontSize, fontStyle, letterSpacing, lineHeight, textAlign, textTransform, children, unescapeHTMLEntities = false, ...props}: TextWrapperProps) => {
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
      style.fontFamily =
        String(style.fontFamily) +
        Platform.select({
          android: '_Italic',
          ios: 'Italic',
        });
    }
    return (
      <Text {...merge({}, props, {style})}>
        {React.Children.map(children, child => {
          if (unescapeHTMLEntities && typeof child === 'string') {
            return decode(child);
          } else {
            return child;
          }
        })}
      </Text>
    );
  },
);
TextWrapper.displayName = 'TextWrapper';

// TODO figure out letter spacing values - what *are* the react native units?
export const FeatureTitleBlack: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={32}
    lineHeight={34}
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    letterSpacing={0.4}
    {...props}
  />
);

export const Title1: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={28}
    lineHeight={34}
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    letterSpacing={0.38}
    {...props}
  />
);

export const Title1Semibold: React.FunctionComponent<TextWrapperProps> = props => (
  <Title1
    fontFamily={Platform.select({
      android: 'Lato_700Bold',
      ios: 'Lato-Bold',
    })}
    {...props}
  />
);
export const Title1Black: React.FunctionComponent<TextWrapperProps> = props => (
  <Title1
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    {...props}
  />
);

export const Title3: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={20}
    lineHeight={24}
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    letterSpacing={-0.45}
    {...props}
  />
);
export const Title3Semibold: React.FunctionComponent<TextWrapperProps> = props => (
  <Title3
    fontFamily={Platform.select({
      android: 'Lato_700Bold',
      ios: 'Lato-Bold',
    })}
    {...props}
  />
);
export const Title3Black: React.FunctionComponent<TextWrapperProps> = props => (
  <Title3
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    {...props}
  />
);

export const bodySize = 16;
export const Body: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={bodySize}
    lineHeight={22}
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    letterSpacing={-0.43}
    {...props}
  />
);
export const BodySemibold: React.FunctionComponent<TextWrapperProps> = props => (
  <Body
    fontFamily={Platform.select({
      android: 'Lato_700Bold',
      ios: 'Lato-Bold',
    })}
    {...props}
  />
);
export const BodyBlack: React.FunctionComponent<TextWrapperProps> = props => (
  <Body
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    {...props}
  />
);

export const bodySmSize = 14;
export const BodySm: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={14}
    lineHeight={21}
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    letterSpacing={-0.31}
    {...props}
  />
);
export const BodySmSemibold: React.FunctionComponent<TextWrapperProps> = props => (
  <BodySm
    fontFamily={Platform.select({
      android: 'Lato_700Bold',
      ios: 'Lato-Bold',
    })}
    {...props}
  />
);
export const BodySmBlack: React.FunctionComponent<TextWrapperProps> = props => (
  <BodySm
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    {...props}
  />
);

export const bodyXSmSize = 12;
export const BodyXSm: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={bodyXSmSize}
    lineHeight={18}
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    letterSpacing={-0.31}
    {...props}
  />
);
export const BodyXSmMedium: React.FunctionComponent<TextWrapperProps> = props => (
  <BodyXSm
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    {...props}
  />
);
export const BodyXSmBlack: React.FunctionComponent<TextWrapperProps> = props => (
  <BodyXSm
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    {...props}
  />
);

export const allCapsSmLineHeight = 18;
export const AllCapsSm: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={13}
    lineHeight={allCapsSmLineHeight}
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    letterSpacing={-0.08}
    {...merge({style: {textTransform: 'uppercase'}}, props)}
  />
);
export const AllCapsSmBlack: React.FunctionComponent<TextWrapperProps> = props => (
  <AllCapsSm
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    {...props}
  />
);

export const Caption1: React.FunctionComponent<TextWrapperProps> = props => (
  <TextWrapper
    fontSize={12}
    lineHeight={16}
    fontFamily={Platform.select({
      android: 'Lato_400Regular',
      ios: 'Lato-Regular',
    })}
    letterSpacing={-0.31}
    {...props}
  />
);
export const Caption1Semibold: React.FunctionComponent<TextWrapperProps> = props => (
  <Caption1
    fontFamily={Platform.select({
      android: 'Lato_700Bold',
      ios: 'Lato-Bold',
    })}
    {...props}
  />
);
export const Caption1Black: React.FunctionComponent<TextWrapperProps> = props => (
  <Caption1
    fontFamily={Platform.select({
      android: 'Lato_900Black',
      ios: 'Lato-Black',
    })}
    {...props}
  />
);
