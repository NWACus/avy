import {View, VStack} from 'components/core';
import {Caption1Semibold} from 'components/text';
import React, {PropsWithChildren} from 'react';
import {ViewStyle} from 'react-native';

export interface TitledPanelProps {
  title: string;
  style: ViewStyle;
}

export const TitledPanel: React.FunctionComponent<PropsWithChildren<TitledPanelProps>> = ({children, title, style}) => {
  return (
    <VStack alignItems="baseline" style={style} pt={8}>
      {children}
      <View py={10} width="100%">
        <Caption1Semibold textTransform="uppercase" style={{textAlign: 'center'}}>
          {title}
        </Caption1Semibold>
      </View>
    </VStack>
  );
};
