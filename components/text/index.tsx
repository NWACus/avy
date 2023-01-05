import * as React from 'react';
import * as _ from 'lodash';

import {ITextProps, Text} from 'native-base';

// TODO figure out letter spacing values - what *are* the react native units?
export const FeatureTitleBlack: React.FunctionComponent<ITextProps> = props => <Text fontSize={32} lineHeight={34} fontFamily="Lato_900Black" letterSpacing={0.4} {...props} />;

export const Title1: React.FunctionComponent<ITextProps> = props => <Text fontSize={28} lineHeight={34} fontFamily="Lato_400Regular" letterSpacing={0.38} {...props} />;
export const Title1Semibold: React.FunctionComponent<ITextProps> = props => <Title1 fontFamily="Lato_700Bold" {...props} />;
export const Title1Black: React.FunctionComponent<ITextProps> = props => <Title1 fontFamily="Lato_900Black" {...props} />;

export const Title3: React.FunctionComponent<ITextProps> = props => <Text fontSize={20} lineHeight={24} fontFamily="Lato_400Regular" letterSpacing={-0.45} {...props} />;
export const Title3Semibold: React.FunctionComponent<ITextProps> = props => <Title3 fontFamily="Lato_700Bold" {...props} />;
export const Title3Black: React.FunctionComponent<ITextProps> = props => <Title3 fontFamily="Lato_900Black" {...props} />;

export const Body: React.FunctionComponent<ITextProps> = props => <Text fontSize={16} lineHeight={22} fontFamily="Lato_400Regular" letterSpacing={-0.43} {...props} />;
export const BodySemibold: React.FunctionComponent<ITextProps> = props => <Body fontFamily="Lato_700Bold" {...props} />;
export const BodyBlack: React.FunctionComponent<ITextProps> = props => <Body fontFamily="Lato_900Black" {...props} />;

export const BodySm: React.FunctionComponent<ITextProps> = props => <Text fontSize={14} lineHeight={21} fontFamily="Lato_400Regular" letterSpacing={-0.31} {...props} />;
export const BodySmSemibold: React.FunctionComponent<ITextProps> = props => <BodySm fontFamily="Lato_700Bold" {...props} />;
export const BodySmBlack: React.FunctionComponent<ITextProps> = props => <BodySm fontFamily="Lato_900Black" {...props} />;

export const BodyXSm: React.FunctionComponent<ITextProps> = props => <Text fontSize={12} lineHeight={18} fontFamily="Lato_400Regular" letterSpacing={-0.31} {...props} />;
export const BodyXSmMedium: React.FunctionComponent<ITextProps> = props => <BodyXSm fontFamily="Lato_400Regular" {...props} />;
export const BodyXSmBlack: React.FunctionComponent<ITextProps> = props => <BodyXSm fontFamily="Lato_900Black" {...props} />;

export const AllCapsSm: React.FunctionComponent<ITextProps> = props => (
  <Text fontSize={13} lineHeight={18} fontFamily="Lato_400Regular" letterSpacing={-0.08} {..._.merge({style: {textTransform: 'uppercase'}}, props ?? {})} />
);
export const AllCapsSmBlack: React.FunctionComponent<ITextProps> = props => <AllCapsSm fontFamily="Lato_900Black" {...props} />;

export const Caption1: React.FunctionComponent<ITextProps> = props => <Text fontSize={12} lineHeight={16} fontFamily="Lato_400Regular" letterSpacing={-0.31} {...props} />;
export const Caption1Semibold: React.FunctionComponent<ITextProps> = props => <Caption1 fontFamily="Lato_700Bold" {...props} />;
export const Caption1Black: React.FunctionComponent<ITextProps> = props => <Caption1 fontFamily="Lato_900Black" {...props} />;
