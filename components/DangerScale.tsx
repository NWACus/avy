import React from 'react';

import {MaterialIcons} from '@expo/vector-icons';

import {DangerLevel} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {BodyXSmBlack, BodyXSmMedium} from 'components/text';
import {TouchableOpacity} from 'react-native';
import {Center, HStack, View} from 'components/core';

export type DangerScaleProps = Omit<React.ComponentProps<typeof View>, 'children'>;

export const DangerScale: React.FunctionComponent<DangerScaleProps> = props => {
  return (
    <View {...props}>
      <HStack backgroundColor="rgba(0, 0, 0, 0.6)" borderRadius={24} px={16} py={8} justifyContent="space-between" alignItems="center">
        <TouchableOpacity
          onPress={() => {
            console.warn('Not implemented yet');
          }}>
          <HStack space={4} alignItems="center">
            <BodyXSmBlack color="white" style={{letterSpacing: -0.61}}>
              Danger Scale
            </BodyXSmBlack>
            <MaterialIcons name="open-in-new" size={16} color="white" />
          </HStack>
        </TouchableOpacity>
        <HStack>
          {Object.keys(DangerLevel)
            .filter(key => Number.isNaN(+key))
            .filter(key => DangerLevel[key] > DangerLevel.None)
            .map(key => DangerLevel[key])
            .map(level => (
              <Center
                key={level}
                style={{
                  backgroundColor: colorFor(level).string(),
                  borderBottomLeftRadius: level === DangerLevel.Low ? 24 : 0,
                  borderTopLeftRadius: level === DangerLevel.Low ? 24 : 0,
                  borderBottomRightRadius: level === DangerLevel.Extreme ? 24 : 0,
                  borderTopRightRadius: level === DangerLevel.Extreme ? 24 : 0,
                }}>
                <BodyXSmMedium style={{paddingHorizontal: 20}} color={level < 4 ? 'darkText' : 'white'}>
                  {level}
                </BodyXSmMedium>
              </Center>
            ))}
        </HStack>
      </HStack>
    </View>
  );
};
