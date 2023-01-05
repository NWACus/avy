import * as React from 'react';
import * as _ from 'lodash';

import {ITextProps, Text} from 'native-base';

// TODO apply default font here
const TextBase: React.FunctionComponent<ITextProps> = props => <Text {...props} />;

// TODO figure out letter spacing values - what *are* the react native units?
export const FeatureTitleBlack: React.FunctionComponent<ITextProps> = props => <TextBase fontSize={32} lineHeight={34} fontWeight={900} letterSpacing={0.4} {...props} />;

export const Title1: React.FunctionComponent<ITextProps> = props => <TextBase fontSize={28} lineHeight={34} fontWeight={400} letterSpacing={0.38} {...props} />;
export const Title1Semibold: React.FunctionComponent<ITextProps> = props => <Title1 fontWeight={600} {...props} />;
export const Title1Black: React.FunctionComponent<ITextProps> = props => <Title1 fontWeight={900} {...props} />;

export const Title3: React.FunctionComponent<ITextProps> = props => <TextBase fontSize={20} lineHeight={24} fontWeight={400} letterSpacing={-0.45} {...props} />;
export const Title3Semibold: React.FunctionComponent<ITextProps> = props => <Title3 fontWeight={600} {...props} />;
export const Title3Black: React.FunctionComponent<ITextProps> = props => <Title3 fontWeight={900} {...props} />;

export const Body: React.FunctionComponent<ITextProps> = props => <TextBase fontSize={16} lineHeight={22} fontWeight={400} letterSpacing={-0.43} {...props} />;
export const BodySemibold: React.FunctionComponent<ITextProps> = props => <Body fontWeight={600} {...props} />;
export const BodyBlack: React.FunctionComponent<ITextProps> = props => <Body fontWeight={900} {...props} />;

export const BodySm: React.FunctionComponent<ITextProps> = props => <TextBase fontSize={14} lineHeight={21} fontWeight={400} letterSpacing={-0.31} {...props} />;
export const BodySmSemibold: React.FunctionComponent<ITextProps> = props => <BodySm fontWeight={600} {...props} />;
export const BodySmBlack: React.FunctionComponent<ITextProps> = props => <BodySm fontWeight={900} {...props} />;

export const BodyXSm: React.FunctionComponent<ITextProps> = props => <TextBase fontSize={12} lineHeight={18} fontWeight={400} letterSpacing={-0.31} {...props} />;
export const BodyXSmMedium: React.FunctionComponent<ITextProps> = props => <BodyXSm fontWeight={500} {...props} />;
export const BodyXSmBlack: React.FunctionComponent<ITextProps> = props => <BodyXSm fontWeight={900} {...props} />;

export const AllCapsSm: React.FunctionComponent<ITextProps> = props => (
  <TextBase fontSize={13} lineHeight={18} fontWeight={500} letterSpacing={-0.08} {..._.merge({style: {textTransform: 'uppercase'}}, props ?? {})} />
);
export const AllCapsSmBlack: React.FunctionComponent<ITextProps> = props => <AllCapsSm fontWeight={900} {...props} />;

export const Caption1: React.FunctionComponent<ITextProps> = props => <TextBase fontSize={12} lineHeight={16} fontWeight={400} letterSpacing={-0.31} {...props} />;
export const Caption1Semibold: React.FunctionComponent<ITextProps> = props => <Caption1 fontWeight={600} {...props} />;
export const Caption1Black: React.FunctionComponent<ITextProps> = props => <Caption1 fontWeight={900} {...props} />;
