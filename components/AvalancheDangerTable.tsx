import React from 'react';

import {HStack, View, VStack} from 'components/core';
import {dangerText} from 'components/helpers/dangerText';
import {Body, Caption1, Caption1Semibold} from 'components/text';
import {AvalancheDangerForecast, ElevationBandNames} from 'types/nationalAvalancheCenter';
import {utcDateToLocalDateString} from 'utils/date';

import {AvalancheDangerIcon, iconSize} from 'components/AvalancheDangerIcon';
import {AvalancheDangerPyramid} from 'components/AvalancheDangerPyramid';

export type DangerTableSize = 'main' | 'outlook';

export interface AvalancheDangerTableProps {
  date: Date;
  forecast: AvalancheDangerForecast;
  elevation_band_names: ElevationBandNames;
  size: DangerTableSize;
}

export const AvalancheDangerTable: React.FunctionComponent<AvalancheDangerTableProps> = ({date, forecast, elevation_band_names, size}: AvalancheDangerTableProps) => {
  const {height, marginLeft, paddingTop} = {
    main: {
      height: 200,
      paddingTop: 13,
      marginLeft: -6,
    },
    outlook: {
      height: 150,
      paddingTop: 10,
      marginLeft: 16,
    },
  }[size];

  const maxIconWidth = Math.max(...[forecast.lower, forecast.middle, forecast.upper].map(d => iconSize(d).width));

  return (
    <VStack space={12} alignItems="stretch">
      <Body>{utcDateToLocalDateString(date)}</Body>
      <View height={height} width="100%">
        {/* This view contains 3 layers stacked over each other: the background bars in gray, the avalanche pyramid, and the text labels and icons */}
        <VStack width="100%" height="100%" position="absolute" justifyContent="space-evenly" alignItems="stretch" space={3} paddingTop={paddingTop} zIndex={10}>
          <View bg="gray.100" flex={1} />
          <View bg="gray.100" flex={1} />
          <View bg="gray.100" flex={1} />
        </VStack>
        <View width="100%" height="100%" position="absolute" zIndex={20}>
          <AvalancheDangerPyramid forecast={forecast} height="100%" style={{marginLeft: marginLeft}} />
        </View>
        <VStack width="100%" height="100%" position="absolute" justifyContent="space-evenly" alignItems="stretch" space={3} paddingTop={paddingTop} zIndex={30}>
          {['upper', 'middle', 'lower'].map((layer, index) => (
            <HStack flex={1} justifyContent="space-between" key={index}>
              <View my={4} px={1} justifyContent="center">
                <Caption1>{elevation_band_names[layer]}</Caption1>
              </View>
              <HStack space={8} alignItems="center" px={1}>
                <View my={4} px={1} justifyContent="center">
                  <Caption1Semibold style={{textTransform: 'uppercase'}}>{dangerText(forecast[layer])}</Caption1Semibold>
                </View>
                {(() => {
                  const size = iconSize(forecast[layer]);
                  const scale = 32.0 / size.height;
                  const rightMargin = Math.max(0, maxIconWidth - size.width) * scale;
                  return <AvalancheDangerIcon style={{height: 32, marginRight: rightMargin}} level={forecast[layer]} />;
                })()}
              </HStack>
            </HStack>
          ))}
        </VStack>
      </View>
    </VStack>
  );
};
