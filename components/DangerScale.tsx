import React from 'react';

import {StyleSheet, View, ViewStyle} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';

import {DangerLevel} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {dangerShortText} from './helpers/dangerText';
import {Center, HStack, Text} from 'native-base';

export interface DangerScaleProps {}

export const DangerScale: React.FunctionComponent<DangerScaleProps> = () => {
  return (
    <HStack backgroundColor="rgba(0, 0, 0, 0.6)" borderRadius={24} px="4" py="2" justifyContent="space-between" alignItems="center">
      <HStack space="1" alignItems="center">
        <Text color="white" bold style={{letterSpacing: -0.61}}>
          Danger Scale
        </Text>
        <MaterialIcons name="open-in-new" size={16} color="white" />
      </HStack>
      <HStack space={0} justifyContent="stretch">
        {Object.keys(DangerLevel)
          .filter(key => Number.isNaN(+key))
          .filter(key => DangerLevel[key] > DangerLevel.None)
          .map(key => DangerLevel[key])
          .map(level => (
            <Center
              style={{
                backgroundColor: colorFor(level).string(),
                borderBottomLeftRadius: level === DangerLevel.Low ? 24 : 0,
                borderTopLeftRadius: level === DangerLevel.Low ? 24 : 0,
                borderBottomRightRadius: level === DangerLevel.Extreme ? 24 : 0,
                borderTopRightRadius: level === DangerLevel.Extreme ? 24 : 0,
              }}>
              <Text key={level} px="5" color={level < 4 ? 'darkText' : 'white'}>
                {level}
              </Text>
            </Center>
          ))}
      </HStack>
    </HStack>
  );
};
