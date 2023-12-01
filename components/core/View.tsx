import * as React from 'react';

import {View as RNView, ViewProps as RNViewProps, ViewStyle as RNViewStyle} from 'react-native';
import {colorLookup} from 'theme';

interface ViewStyleProps {
  backgroundColor?: RNViewStyle['backgroundColor'];

  position?: RNViewStyle['position'];
  top?: RNViewStyle['top'];
  left?: RNViewStyle['left'];
  right?: RNViewStyle['right'];
  bottom?: RNViewStyle['bottom'];
  zIndex?: RNViewStyle['zIndex'];

  padding?: RNViewStyle['padding'];
  paddingHorizontal?: RNViewStyle['paddingHorizontal'];
  paddingVertical?: RNViewStyle['paddingVertical'];
  paddingTop?: RNViewStyle['paddingTop'];
  paddingLeft?: RNViewStyle['paddingLeft'];
  paddingRight?: RNViewStyle['paddingRight'];
  paddingBottom?: RNViewStyle['paddingBottom'];

  margin?: RNViewStyle['margin'];
  marginHorizontal?: RNViewStyle['marginHorizontal'];
  marginVertical?: RNViewStyle['marginVertical'];
  marginTop?: RNViewStyle['marginTop'];
  marginLeft?: RNViewStyle['marginLeft'];
  marginRight?: RNViewStyle['marginRight'];
  marginBottom?: RNViewStyle['marginBottom'];

  alignContent?: RNViewStyle['alignContent'];
  alignItems?: RNViewStyle['alignItems'];
  alignSelf?: RNViewStyle['alignSelf'];
  flex?: RNViewStyle['flex'];
  flexBasis?: RNViewStyle['flexBasis'];
  flexDirection?: RNViewStyle['flexDirection'];
  flexGrow?: RNViewStyle['flexGrow'];
  flexShrink?: RNViewStyle['flexShrink'];
  flexWrap?: RNViewStyle['flexWrap'];
  justifyContent?: RNViewStyle['justifyContent'];

  aspectRatio?: RNViewStyle['aspectRatio'];
  width?: RNViewStyle['width'];
  height?: RNViewStyle['height'];
  maxHeight?: RNViewStyle['maxHeight'];
  maxWidth?: RNViewStyle['maxWidth'];
  minHeight?: RNViewStyle['minHeight'];
  minWidth?: RNViewStyle['minWidth'];

  borderBottomLeftRadius?: RNViewStyle['borderBottomLeftRadius'];
  borderBottomRightRadius?: RNViewStyle['borderBottomRightRadius'];
  borderTopLeftRadius?: RNViewStyle['borderTopLeftRadius'];
  borderTopRightRadius?: RNViewStyle['borderTopRightRadius'];
  borderRadius?: RNViewStyle['borderRadius'];
  borderBottomWidth?: RNViewStyle['borderBottomWidth'];
  borderLeftWidth?: RNViewStyle['borderLeftWidth'];
  borderRightWidth?: RNViewStyle['borderRightWidth'];
  borderTopWidth?: RNViewStyle['borderTopWidth'];
  borderWidth?: RNViewStyle['borderWidth'];
  borderColor?: RNViewStyle['borderColor'];

  display?: RNViewStyle['display'];
  overflow?: RNViewStyle['overflow'];
}

interface ViewAliasProps {
  bg?: ViewStyleProps['backgroundColor'];

  p?: ViewStyleProps['padding'];
  px?: ViewStyleProps['paddingHorizontal'];
  py?: ViewStyleProps['paddingVertical'];
  pt?: ViewStyleProps['paddingTop'];
  pl?: ViewStyleProps['paddingLeft'];
  pr?: ViewStyleProps['paddingRight'];
  pb?: ViewStyleProps['paddingBottom'];

  m?: ViewStyleProps['margin'];
  mx?: ViewStyleProps['marginHorizontal'];
  my?: ViewStyleProps['marginVertical'];
  mt?: ViewStyleProps['marginTop'];
  ml?: ViewStyleProps['marginLeft'];
  mr?: ViewStyleProps['marginRight'];
  mb?: ViewStyleProps['marginBottom'];
}

type ViewAliasProp = keyof ViewAliasProps;
type ViewStyleProp = keyof ViewStyleProps;

const viewStyleProps: Record<ViewStyleProp | ViewAliasProp, ViewStyleProp | ViewAliasProp> = {
  backgroundColor: 'backgroundColor',

  position: 'position',
  top: 'top',
  left: 'left',
  right: 'right',
  bottom: 'bottom',
  zIndex: 'zIndex',

  padding: 'padding',
  paddingHorizontal: 'paddingHorizontal',
  paddingVertical: 'paddingVertical',
  paddingTop: 'paddingTop',
  paddingLeft: 'paddingLeft',
  paddingRight: 'paddingRight',
  paddingBottom: 'paddingBottom',

  margin: 'margin',
  marginHorizontal: 'marginHorizontal',
  marginVertical: 'marginVertical',
  marginTop: 'marginTop',
  marginLeft: 'marginLeft',
  marginRight: 'marginRight',
  marginBottom: 'marginBottom',

  alignContent: 'alignContent',
  alignItems: 'alignItems',
  alignSelf: 'alignSelf',
  flex: 'flex',
  flexBasis: 'flexBasis',
  flexDirection: 'flexDirection',
  flexGrow: 'flexGrow',
  flexShrink: 'flexShrink',
  flexWrap: 'flexWrap',
  justifyContent: 'justifyContent',

  aspectRatio: 'aspectRatio',
  width: 'width',
  height: 'height',
  maxHeight: 'maxHeight',
  maxWidth: 'maxWidth',
  minHeight: 'minHeight',
  minWidth: 'minWidth',

  borderBottomLeftRadius: 'borderBottomLeftRadius',
  borderBottomRightRadius: 'borderBottomRightRadius',
  borderTopLeftRadius: 'borderTopLeftRadius',
  borderTopRightRadius: 'borderTopRightRadius',
  borderRadius: 'borderRadius',
  borderBottomWidth: 'borderBottomWidth',
  borderLeftWidth: 'borderLeftWidth',
  borderRightWidth: 'borderRightWidth',
  borderTopWidth: 'borderTopWidth',
  borderWidth: 'borderWidth',
  borderColor: 'borderColor',

  display: 'display',
  overflow: 'overflow',

  bg: 'bg',

  p: 'p',
  px: 'px',
  py: 'py',
  pt: 'pt',
  pl: 'pl',
  pr: 'pr',
  pb: 'pb',

  m: 'm',
  mx: 'mx',
  my: 'my',
  mt: 'mt',
  ml: 'ml',
  mr: 'mr',
  mb: 'mb',
} as const;

const propAliasMapping: Record<keyof ViewAliasProps, keyof ViewStyleProps> = {
  bg: 'backgroundColor',

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

const unaliasAliasProps = (props: ViewAliasProps): ViewStyleProps => {
  const unaliasedProps: ViewStyleProps = {
    backgroundColor: props.bg,

    padding: props.p,
    paddingHorizontal: props.px,
    paddingVertical: props.py,
    paddingTop: props.pt,
    paddingLeft: props.pl,
    paddingRight: props.pr,
    paddingBottom: props.pb,

    margin: props.m,
    marginHorizontal: props.mx,
    marginVertical: props.my,
    marginTop: props.mt,
    marginLeft: props.ml,
    marginRight: props.mr,
    marginBottom: props.mb,
  };
  // Remove any undefined fields from unaliasedProps before returning it
  (Object.keys(unaliasedProps) as ViewStyleProp[]).forEach(key => unaliasedProps[key] === undefined && delete unaliasedProps[key]);
  return unaliasedProps;
};

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

// Given an object and a set of keys, return an array of two objects:
// 1. An object containing only the keys in the keySet
// 2. An object containing only the keys not in the keySet
function split<T extends object, K extends keyof T>(obj: T, keySet: Record<K, string>): [Pick<T, K>, Pick<T, Exclude<keyof T, K>>] {
  const pick = {} as Pick<T, K>;
  const unpick = {} as Pick<T, Exclude<keyof T, K>>;
  (Object.keys(obj) as (keyof T)[]).forEach(k => {
    if (k in keySet) {
      const kk = k as K;
      pick[kk] = obj[kk];
    } else {
      const kk = k as Exclude<keyof T, K>;
      unpick[kk] = obj[kk];
    }
  });
  return [pick, unpick];
}

export interface ViewProps extends RNViewProps, ViewStyleProps, ViewAliasProps {}
export const View = React.forwardRef<RNView, ViewProps>(({children, style, ...props}, ref) => {
  const [allStyleProps, viewProps] = split(props, viewStyleProps);
  const [aliasedProps, unaliasedStyleProps] = split(allStyleProps, propAliasMapping);
  const stylesFromProps = {
    ...unaliasedStyleProps,
    ...unaliasAliasProps(aliasedProps),
  };

  let styleProp: ViewStyleProp;
  for (styleProp in stylesFromProps) {
    validateProp(styleProp, stylesFromProps[styleProp]);
  }

  if (typeof stylesFromProps['backgroundColor'] === 'string') {
    stylesFromProps['backgroundColor'] = colorLookup(stylesFromProps['backgroundColor']);
  }

  return (
    <RNView {...viewProps} style={[style, stylesFromProps]} ref={ref}>
      {children}
    </RNView>
  );
});
View.displayName = 'AvyViewWrapper';
