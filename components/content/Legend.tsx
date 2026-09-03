import React from 'react';

import {InfoTooltip} from 'components/content/InfoTooltip';
import {HStack, View} from 'components/core';

export type LegendProps = Omit<React.ComponentProps<typeof View>, 'children'> & {
  infoTitle: string;
  infoContent: string;
  children: React.ReactNode;
};

export const Legend: React.FunctionComponent<LegendProps> = ({infoTitle, infoContent, children, ...props}) => {
  return (
    <View {...props}>
      <HStack backgroundColor="rgba(0, 0, 0, 0.6)" borderRadius={24} px={16} py={8} justifyContent="space-between" alignItems="center">
        <HStack pr={8} flex={1} flexGrow={1}>
          {children}
        </HStack>
        <View>
          <InfoTooltip color="white" size={20} title={infoTitle} style={{padding: 0}} hitSlop={{top: 8, left: 8, bottom: 8, right: 8}} content={infoContent} />
        </View>
      </HStack>
    </View>
  );
};
