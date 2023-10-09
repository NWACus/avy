import React from 'react';

import {colorFor} from 'components/AvalancheDangerTriangle';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {Center, HStack, View, VStack} from 'components/core';
import {dangerShortName, dangerShortText, dangerValue} from 'components/helpers/dangerText';
import {BodyXSm, BodyXSmBlack} from 'components/text';
import helpStrings from 'content/helpStrings';
import {DangerLevel} from 'types/nationalAvalancheCenter';

export type DangerScaleProps = Omit<React.ComponentProps<typeof View>, 'children'>;

export const DangerScale: React.FunctionComponent<DangerScaleProps> = props => {
  return (
    <View {...props}>
      <HStack backgroundColor="rgba(0, 0, 0, 0.6)" borderRadius={24} px={16} py={8} justifyContent="space-between" alignItems="center">
        <HStack pr={8} flex={1} flexGrow={1}>
          {[DangerLevel.Low, DangerLevel.Moderate, DangerLevel.Considerable, DangerLevel.High, DangerLevel.Extreme].map(level => (
            <Center
              key={level}
              flex={1}
              flexGrow={1}
              style={{
                backgroundColor: colorFor(level).string(),
                borderBottomLeftRadius: level === DangerLevel.Low ? 24 : 0,
                borderTopLeftRadius: level === DangerLevel.Low ? 24 : 0,
                borderBottomRightRadius: level === DangerLevel.Extreme ? 24 : 0,
                borderTopRightRadius: level === DangerLevel.Extreme ? 24 : 0,
              }}>
              <BodyXSmBlack style={{paddingHorizontal: 4}} color={level < 4 ? 'text' : 'white'}>
                {dangerShortText(level)}
              </BodyXSmBlack>
            </Center>
          ))}
        </HStack>
        <View>
          <InfoTooltip color="white" size={16} title="Danger Scale" style={{padding: 0}} hitSlop={{top: 8, left: 8, bottom: 8, right: 8}} content={helpStrings.dangerScaleDetail} />
        </View>
      </HStack>
    </View>
  );
};

export const InlineDangerScale: React.FunctionComponent<DangerScaleProps> = props => {
  return (
    <View {...props}>
      <HStack justifyContent="space-between" alignItems="center">
        <HStack pr={8} flex={1} flexGrow={1}>
          {[DangerLevel.Low, DangerLevel.Moderate, DangerLevel.Considerable, DangerLevel.High, DangerLevel.Extreme].map(level => (
            <VStack key={level} flex={1} flexGrow={1} space={4}>
              <Center
                style={{
                  height: 12,
                  backgroundColor: colorFor(level).string(),
                  borderWidth: 0.19,
                }}></Center>
              <Center>
                <HStack style={{paddingHorizontal: 4}} space={2}>
                  <BodyXSmBlack>{dangerValue(level)}</BodyXSmBlack>
                  <BodyXSm>- {dangerShortName(level)}</BodyXSm>
                </HStack>
              </Center>
            </VStack>
          ))}
        </HStack>
      </HStack>
    </View>
  );
};
