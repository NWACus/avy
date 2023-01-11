import React from 'react';

import {HStack, View, VStack} from 'native-base';

import {AvalancheDangerForecast, ElevationBandNames} from 'types/nationalAvalancheCenter';
import {dangerText} from 'components/helpers/dangerText';
import {utcDateToLocalDateString} from 'utils/date';
import {Body, Caption1, Caption1Semibold} from 'components/text';

import {AvalancheDangerPyramid} from './AvalancheDangerPyramid';
import {AvalancheDangerIcon} from './AvalancheDangerIcon';

export interface AvalancheDangerTableProps {
  date: Date;
  current: AvalancheDangerForecast;
  elevation_band_names: ElevationBandNames;
}

export const AvalancheDangerTable: React.FunctionComponent<AvalancheDangerTableProps> = ({date, current, elevation_band_names}: AvalancheDangerTableProps) => {
  return (
    <VStack space={3} alignItems="stretch">
      <Body>{utcDateToLocalDateString(date)}</Body>
      <View height="200" width="100%">
        {/* This view contains 3 layers stacked over each other: the background bars in gray, the avalanche pyramid, and the text labels and icons */}
        <VStack width="100%" height="100%" position="absolute" justifyContent="stretch" alignItems="stretch" alignContent="stretch" space="3px" paddingTop="13px" zIndex={10}>
          <View bg="gray.100" flex={1} />
          <View bg="gray.100" flex={1} />
          <View bg="gray.100" flex={1} />
        </VStack>
        <View width="100%" height="100%" position="absolute" zIndex={20}>
          <AvalancheDangerPyramid forecast={current} height="100%" />
        </View>
        <VStack width="100%" height="100%" position="absolute" justifyContent="stretch" alignItems="stretch" space="3px" paddingTop="13px" zIndex={30}>
          {['upper', 'middle', 'lower'].map((layer, index) => (
            <HStack flex={1} justifyContent="space-between" key={index}>
              <View bg="white" my={4} px={1} justifyContent="center">
                <Caption1 color="lightText">{elevation_band_names[layer]}</Caption1>
              </View>
              <HStack space={2} alignItems="center" px={1}>
                <View my={4} px={1} justifyContent="center">
                  <Caption1Semibold style={{textTransform: 'uppercase'}}>{dangerText(current[layer])}</Caption1Semibold>
                </View>
                <AvalancheDangerIcon style={{height: 32}} level={current[layer]} />
              </HStack>
            </HStack>
          ))}
        </VStack>
      </View>
    </VStack>
  );
};
