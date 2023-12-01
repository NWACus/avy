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

const viewStylePropKeyset: Record<ViewStyleProp | ViewAliasProp, boolean> = {
  backgroundColor: true,

  position: true,
  top: true,
  left: true,
  right: true,
  bottom: true,
  zIndex: true,

  padding: true,
  paddingHorizontal: true,
  paddingVertical: true,
  paddingTop: true,
  paddingLeft: true,
  paddingRight: true,
  paddingBottom: true,

  margin: true,
  marginHorizontal: true,
  marginVertical: true,
  marginTop: true,
  marginLeft: true,
  marginRight: true,
  marginBottom: true,

  alignContent: true,
  alignItems: true,
  alignSelf: true,
  flex: true,
  flexBasis: true,
  flexDirection: true,
  flexGrow: true,
  flexShrink: true,
  flexWrap: true,
  justifyContent: true,

  aspectRatio: true,
  width: true,
  height: true,
  maxHeight: true,
  maxWidth: true,
  minHeight: true,
  minWidth: true,

  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderRadius: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderTopWidth: true,
  borderWidth: true,
  borderColor: true,

  display: true,
  overflow: true,

  bg: true,

  p: true,
  px: true,
  py: true,
  pt: true,
  pl: true,
  pr: true,
  pb: true,

  m: true,
  mx: true,
  my: true,
  mt: true,
  ml: true,
  mr: true,
  mb: true,
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

const viewAliasPropKeyset = Object.keys(propAliasMapping).reduce((acc, aliasProp) => {
  acc[aliasProp as ViewAliasProp] = true;
  return acc;
}, {} as Record<ViewAliasProp, boolean>);

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

function split<T extends object, K extends keyof T>(obj: T, keySet: Record<K, boolean>): [Pick<T, K>, Pick<T, Exclude<keyof T, K>>] {
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
  const [allStyleProps, viewProps] = split(props, viewStylePropKeyset);
  const [aliasedProps, unaliasedStyleProps] = split(allStyleProps, viewAliasPropKeyset);
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
