import React from 'react';

import {DangerLevel} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {BodyXSmBlack} from 'components/text';
import {Center, HStack, View} from 'components/core';
import {dangerShortText} from 'components/helpers/dangerText';
import {InfoTooltip} from 'components/content/InfoTooltip';

export type DangerScaleProps = Omit<React.ComponentProps<typeof View>, 'children'>;

export const DangerScale: React.FunctionComponent<DangerScaleProps> = props => {
  return (
    <View {...props}>
      <HStack backgroundColor="rgba(0, 0, 0, 0.6)" borderRadius={24} px={16} py={8} justifyContent="space-between" alignItems="center">
        <HStack pr={8} flex={1} flexGrow={1}>
          {Object.keys(DangerLevel)
            .filter(key => Number.isNaN(+key))
            .filter(key => DangerLevel[key] > DangerLevel.None)
            .map(key => DangerLevel[key])
            .map(level => (
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
                <BodyXSmBlack style={{paddingHorizontal: 4}} color={level < 4 ? 'darkText' : 'white'}>
                  {dangerShortText(level)}
                </BodyXSmBlack>
              </Center>
            ))}
        </HStack>
        <View>
          <InfoTooltip
            color="white"
            size={16}
            title="Danger Scale"
            style={{padding: 0}}
            hitSlop={{top: 8, left: 8, bottom: 8, right: 8}}
            content={`
              <p>The North American Public Avalanche Danger Scale (NAPADS) is a system that rates avalanche danger and provides general travel advice
              based on the likelihood, size, and distribution of expected avalanches. It consists of five levels, from least to highest amount of
              danger: 1 – Low, 2 – Moderate, 3 – Considerable, 4 – High, 5 – Extreme. Danger ratings are typically provided for three distinct
              elevation bands. Although the danger ratings are assigned numerical levels, the danger increases exponentially between levels.
              In other words, the hazard rises more dramatically as it ascends toward the higher levels on the scale.</p>
              <p><a href='https://avalanche.org/avalanche-encyclopedia/danger-scale/'>Click here</a> to learn more.</p>`}
          />
        </View>
      </HStack>
    </View>
  );
};
