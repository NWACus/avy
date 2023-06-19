import * as React from 'react';

import {View as RNView, ViewProps as RNViewProps, ViewStyle as RNViewStyle} from 'react-native';

import {colorLookup} from 'theme';

class ViewStyleProps {
  constructor(
    readonly backgroundColor?: RNViewStyle['backgroundColor'],

    readonly position?: RNViewStyle['position'],
    readonly top?: RNViewStyle['top'],
    readonly left?: RNViewStyle['left'],
    readonly right?: RNViewStyle['right'],
    readonly bottom?: RNViewStyle['bottom'],
    readonly zIndex?: RNViewStyle['zIndex'],

    readonly padding?: RNViewStyle['padding'],
    readonly paddingHorizontal?: RNViewStyle['paddingHorizontal'],
    readonly paddingVertical?: RNViewStyle['paddingVertical'],
    readonly paddingTop?: RNViewStyle['paddingTop'],
    readonly paddingLeft?: RNViewStyle['paddingLeft'],
    readonly paddingRight?: RNViewStyle['paddingRight'],
    readonly paddingBottom?: RNViewStyle['paddingBottom'],

    readonly margin?: RNViewStyle['margin'],
    readonly marginHorizontal?: RNViewStyle['marginHorizontal'],
    readonly marginVertical?: RNViewStyle['marginVertical'],
    readonly marginTop?: RNViewStyle['marginTop'],
    readonly marginLeft?: RNViewStyle['marginLeft'],
    readonly marginRight?: RNViewStyle['marginRight'],
    readonly marginBottom?: RNViewStyle['marginBottom'],

    readonly alignContent?: RNViewStyle['alignContent'],
    readonly alignItems?: RNViewStyle['alignItems'],
    readonly alignSelf?: RNViewStyle['alignSelf'],
    readonly flex?: RNViewStyle['flex'],
    readonly flexBasis?: RNViewStyle['flexBasis'],
    readonly flexDirection?: RNViewStyle['flexDirection'],
    readonly flexGrow?: RNViewStyle['flexGrow'],
    readonly flexShrink?: RNViewStyle['flexShrink'],
    readonly flexWrap?: RNViewStyle['flexWrap'],
    readonly justifyContent?: RNViewStyle['justifyContent'],

    readonly aspectRatio?: RNViewStyle['aspectRatio'],
    readonly width?: RNViewStyle['width'],
    readonly height?: RNViewStyle['height'],
    readonly maxHeight?: RNViewStyle['maxHeight'],
    readonly maxWidth?: RNViewStyle['maxWidth'],
    readonly minHeight?: RNViewStyle['minHeight'],
    readonly minWidth?: RNViewStyle['minWidth'],

    readonly borderBottomLeftRadius?: RNViewStyle['borderBottomLeftRadius'],
    readonly borderBottomRightRadius?: RNViewStyle['borderBottomRightRadius'],
    readonly borderTopLeftRadius?: RNViewStyle['borderTopLeftRadius'],
    readonly borderTopRightRadius?: RNViewStyle['borderTopRightRadius'],
    readonly borderRadius?: RNViewStyle['borderRadius'],
    readonly borderBottomWidth?: RNViewStyle['borderBottomWidth'],
    readonly borderLeftWidth?: RNViewStyle['borderLeftWidth'],
    readonly borderRightWidth?: RNViewStyle['borderRightWidth'],
    readonly borderTopWidth?: RNViewStyle['borderTopWidth'],
    readonly borderWidth?: RNViewStyle['borderWidth'],
    readonly borderColor?: RNViewStyle['borderColor'],

    readonly display?: RNViewStyle['display'],
    readonly overflow?: RNViewStyle['overflow'],
  ) {}
}

class ViewAliasProps {
  constructor(
    readonly bg?: RNViewStyle['backgroundColor'],
    readonly bgColor?: RNViewStyle['backgroundColor'],

    readonly p?: RNViewStyle['padding'],
    readonly px?: RNViewStyle['paddingHorizontal'],
    readonly py?: RNViewStyle['paddingVertical'],
    readonly pt?: RNViewStyle['paddingTop'],
    readonly pl?: RNViewStyle['paddingLeft'],
    readonly pr?: RNViewStyle['paddingRight'],
    readonly pb?: RNViewStyle['paddingBottom'],

    readonly m?: RNViewStyle['margin'],
    readonly mx?: RNViewStyle['marginHorizontal'],
    readonly my?: RNViewStyle['marginVertical'],
    readonly mt?: RNViewStyle['marginTop'],
    readonly ml?: RNViewStyle['marginLeft'],
    readonly mr?: RNViewStyle['marginRight'],
    readonly mb?: RNViewStyle['marginBottom'],
  ) {}
}

type ViewStyleProp = keyof ViewStyleProps | keyof ViewAliasProps;
const viewStylePropKeys: ViewStyleProp[] = (Object.keys(new ViewStyleProps()) as ViewStyleProp[]).concat(Object.keys(new ViewAliasProps()) as ViewStyleProp[]);

const propAliasMapping: Record<keyof ViewAliasProps, keyof ViewStyleProps> = {
  bg: 'backgroundColor',
  bgColor: 'backgroundColor',

  p: 'padding',
  px: 'paddingHorizontal',
  py: 'paddingVertical',
  pt: 'paddingTop',
  pl: 'paddingLeft',
  pr: 'paddingRight',
  pb: 'paddingBottom',

  m: 'margin',
  mx: 'marginHorizontal',
  my: 'marginVertical',
  mt: 'marginTop',
  ml: 'marginLeft',
  mr: 'marginRight',
  mb: 'marginBottom',
} as const;

const dimensionalProps: ViewStyleProp[] = [
  'bottom',
  'flexBasis',
  'height',
  'left',
  'margin',
  'marginBottom',
  'marginHorizontal',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'padding',
  'paddingBottom',
  'paddingHorizontal',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingVertical',
  'right',
  'top',
  'width',
];

const validateProp = (prop: ViewStyleProp, value: unknown): void => {
  if (dimensionalProps.includes(prop) && typeof value === 'string') {
    // Dimensions as strings must either specify 'pt' or '%'
    if (value !== 'auto' && value.slice(-2) !== 'pt' && value.slice(-1) !== '%') {
      const error = `Invalid string value "${value}" for property ${prop}: string dimensions must specify pt or %`;
      throw new Error(error);
    }
  }
};

export interface ViewProps extends RNViewProps, ViewStyleProps, ViewAliasProps {}
export const View = React.forwardRef<RNView, ViewProps>(({children, style = {}, ...props}, ref) => {
  const resolvedProps: ViewProps = {style};
  Object.entries(props).forEach(([key, value]) => {
    const prop = propAliasMapping[key as keyof ViewAliasProps] || key;
    if (viewStylePropKeys.includes(prop)) {
      if (['backgroundColor'].includes(prop) && typeof value === 'string') {
        value = colorLookup(value);
      }
      validateProp(prop, value);
      if (style) {
        // TODO(bsharon): this needs to be cleaned up to be accordant with typescript ...
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        style[prop] = value;
      }
    } else {
      // TODO(bsharon): this needs to be cleaned up to be accordant with typescript ...
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      resolvedProps[prop] = value;
    }
  });
  return (
    <RNView {...resolvedProps} ref={ref}>
      {children}
    </RNView>
  );
});
View.displayName = 'View';
