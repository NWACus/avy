import React from 'react';

import {MaterialIcons} from '@expo/vector-icons';

import {DangerLevel} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {Center, HStack} from 'native-base';
import {BodyXSmBlack, BodyXSmMedium} from 'components/text';

export const DangerScale: React.FunctionComponent = () => {
  return (
    <HStack backgroundColor="rgba(0, 0, 0, 0.6)" borderRadius={24} px="4" py="2" justifyContent="space-between" alignItems="center">
      <HStack space="1" alignItems="center">
        <BodyXSmBlack color="white" bold style={{letterSpacing: -0.61}}>
          Danger Scale
        </BodyXSmBlack>
        <MaterialIcons name="open-in-new" size={16} color="white" />
      </HStack>
      <HStack space={0} justifyContent="stretch">
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
              <BodyXSmMedium px="5" color={level < 4 ? 'darkText' : 'white'}>
                {level}
              </BodyXSmMedium>
            </Center>
          ))}
      </HStack>
    </HStack>
  );
};
