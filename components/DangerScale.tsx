import React from 'react';

import {MaterialIcons} from '@expo/vector-icons';

import {DangerLevel} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {BodyXSmBlack} from 'components/text';
import {Linking, TouchableOpacity} from 'react-native';
import {Center, HStack, View} from 'components/core';
import {dangerShortText} from 'components/helpers/dangerText';

export type DangerScaleProps = Omit<React.ComponentProps<typeof View>, 'children'>;

export const DangerScale: React.FunctionComponent<DangerScaleProps> = props => {
  return (
    <View {...props}>
      <HStack backgroundColor="rgba(0, 0, 0, 0.6)" borderRadius={24} px={16} py={8} justifyContent="space-between" alignItems="center">
        <TouchableOpacity
          onPress={() => {
            Linking.openURL('https://avalanche.org/avalanche-encyclopedia/danger-scale/');
          }}>
          <HStack space={4}>
            <MaterialIcons name="open-in-new" size={16} color="white" />
          </HStack>
        </TouchableOpacity>
        <HStack px={8}>
          {Object.keys(DangerLevel)
            .filter(key => Number.isNaN(+key))
            .filter(key => DangerLevel[key] > DangerLevel.None)
            .map(key => DangerLevel[key])
            .map(level => (
              <Center
                key={level}
                style={{
                  flex: 1,
                  flexGrow: 1,
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
      </HStack>
    </View>
  );
};
