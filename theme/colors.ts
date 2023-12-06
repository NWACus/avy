import {ColorValue} from 'react-native';
import tinycolor from 'tinycolor2';

// A lot of colors from the designers are specified with alpha channels, but we want these colors to
// be solid as opposed to letting the underlying colors through. Also, things with alpha channels are sometimes
// treated differently - as an example, a color with alpha will render differently in a background vs a border.
const rgbaToHexString = (rgba: string): string => {
  const c = tinycolor(rgba).toRgb();
  // We calculate the actual color by blending it with pure white at one minus alpha
  return tinycolor({
    r: Math.max(0, Math.min(255, Math.round(c.r * c.a + 255.0 * (1.0 - c.a)))),
    g: Math.max(0, Math.min(255, Math.round(c.g * c.a + 255.0 * (1.0 - c.a)))),
    b: Math.max(0, Math.min(255, Math.round(c.b * c.a + 255.0 * (1.0 - c.a)))),
  }).toHexString();
};

export const COLORS: Record<string, ColorValue> = {
  //
  // NWAC colors
  //
  // Primary
  primary: rgbaToHexString('rgba(9, 109, 217, 1)'), // aka Core/primary-blue in Figma
  'primary.hover': rgbaToHexString('rgba(64, 169, 255, 1)'),
  'primary.active': rgbaToHexString('rgba(9, 109, 217, 1)'),
  'primary.outline': rgbaToHexString('rgba(24, 144, 255, 0.2)'),
  'primary.background': rgbaToHexString('rgba(246, 248, 252, 1)'), // aka #F6F8FC
  'primary.border': rgbaToHexString('rgba(24, 144, 255, 0.2)'), // TODO: need to get this from the designers
  //
  // UI
  blue1: rgbaToHexString('rgba(24, 144, 255, 1)'),
  blue2: rgbaToHexString('rgba(0, 80, 179, 1)'),
  blue2Background: rgbaToHexString('rgba(0, 80, 179, 0.2)'),
  blue3: rgbaToHexString('rgba(0, 58, 140, 1)'),
  'NWAC-dark': rgbaToHexString('rgba(20, 45, 86, 1)'),
  'NWAC-light': rgbaToHexString('rgba(160, 204, 216, 1)'),
  'color-tag': '#ECF6FF',
  //
  // Neutral
  text: rgbaToHexString('rgba(0, 0, 0, 0.85)'),
  'text.secondary': rgbaToHexString('rgba(0, 0, 0, 0.7)'),
  'text.tertiary': rgbaToHexString('rgba(0, 0, 0, 0.45)'),
  disabled: rgbaToHexString('rgba(0, 0, 0, 0.25)'),
  'border.base': rgbaToHexString('rgba(0, 0, 0, 0.15)'),
  'border.split': rgbaToHexString('rgba(0, 0, 0, 0.06)'),
  'background.base': rgbaToHexString('rgba(0, 0, 0, 0.04)'),
  'background.color-light': rgbaToHexString('rgba(0, 0, 0, 0.02)'),

  'error.color': rgbaToHexString('rgba(222, 75, 70, 1)'),
  'error.color-primary': rgbaToHexString('rgba(218, 55, 49, 1)'),

  // Functional
  success: rgbaToHexString('rgba(82, 196, 26, 1)'),
  'success.hover': rgbaToHexString('rgba(115, 209, 61, 1)'),
  'success.active': rgbaToHexString('rgba(56, 158, 13, 1)'),
  'success.outline': rgbaToHexString('rgba(82, 196, 26, 0.2)'),
  'success.background': rgbaToHexString('rgba(246, 255, 237, 1)'),
  'success.border': rgbaToHexString('rgba(183, 235, 143, 1)'),

  // TODO: add info variants that are shades of grey ?

  warning: rgbaToHexString('rgba(250, 173, 20, 1)'),
  'warning.hover': rgbaToHexString('rgba(255, 197, 61, 1)'),
  'warning.active': rgbaToHexString('rgba(212, 136, 6, 1)'),
  'warning.outline': rgbaToHexString('rgba(250, 173, 20, 0.2)'),
  'warning.background': rgbaToHexString('rgba(255, 251, 230, 1)'),
  'warning.border': rgbaToHexString('rgba(255, 229, 143, 1)'),

  error: rgbaToHexString('rgba(222, 75, 70, 1)'),
  'error.hover': rgbaToHexString('rgba(229, 115, 111, 1)'),
  'error.active': rgbaToHexString('rgba(218, 55, 49, 1)'),
  'error.outline': rgbaToHexString('rgba(255, 77, 79, 0.2)'),
  'error.background': rgbaToHexString('rgba(255, 241, 240, 1)'),
  'error.border': rgbaToHexString('rgba(255, 163, 158, 1)'),

  // NAC Colors
  general_information: '#909092',
  low: '#6CB557',
  moderate: '#FEF051',
  considerable: '#EA983F',
  high: '#DB3832',
  extreme: '#221F20',

  'weather.nwac.primary': '#0059C8',
  'weather.nwac.secondary': '#98CBFF',
  'weather.snotel.primary': '#006D23',
  'weather.snotel.secondary': '#9ED696',
  'weather.mesowest.primary': '#EA983F',
  'weather.mesowest.secondary': 'rgba(234, 152, 63, 0.2)',

  'observer.forecaster.primary': '#0059C8',
  'observer.forecaster.secondary': '#98CBFF',
  'observer.intern.primary': '#0059C8',
  'observer.intern.secondary': '#98CBFF',
  'observer.professional.primary': '#006D23',
  'observer.professional.secondary': '#9ED696',
  'observer.observer.primary': '#006D23',
  'observer.observer.secondary': '#9ED696',
  'observer.educator.primary': '#006D23',
  'observer.educator.secondary': '#9ED696',
  'observer.volunteer.primary': '#EA983F',
  'observer.volunteer.secondary': 'rgba(234, 152, 63, 0.2)',
  'observer.public.primary': '#EA983F',
  'observer.public.secondary': 'rgba(234, 152, 63, 0.2)',
  'observer.other.primary': '#EA983F',
  'observer.other.secondary': 'rgba(234, 152, 63, 0.2)',

  // Color aliases from NativeBase
  // TODO: give these semantic names or replace them with named colors above
  'blue.100': '#dbeafe',
  'gray.100': '#f4f4f5',
  'gray.700': '#3f3f46',
  'gray.900': '#18181b',
  'error.900': '#7f1d1d',
  'warning.700': '#c2410c',
  'muted.700': '#404040',
  'light.100': '#f5f5f4',
  'light.300': '#d6d3d1',
} as const;

export const colorLookup = (color: ColorValue): ColorValue => (typeof color === 'string' && COLORS[color] ? COLORS[color] : color);
