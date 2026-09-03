import React from 'react';

import {colorFor} from 'components/AvalancheDangerTriangle';
import {Legend} from 'components/content/Legend';
import {Center, HStack, View, VStack} from 'components/core';
import {dangerShortName, dangerShortText, dangerValue} from 'components/helpers/dangerText';
import {BodyXSm, BodyXSmBlack} from 'components/text';
import helpStrings from 'content/helpStrings';
import {DangerLevel} from 'types/nationalAvalancheCenter';

export type DangerScaleProps = Omit<React.ComponentProps<typeof View>, 'children'>;

export const DangerScale: React.FunctionComponent<DangerScaleProps> = props => {
  return (
    <Legend {...props} infoTitle="Danger Scale" infoContent={helpStrings.dangerScaleDetail}>
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
          <BodyXSmBlack style={{paddingHorizontal: 4}} color={level < DangerLevel.High ? 'text' : 'white'}>
            {dangerShortText(level)}
          </BodyXSmBlack>
        </Center>
      ))}
    </Legend>
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
