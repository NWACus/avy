import React from 'react';

import {HStack, View, VStack} from 'components/core';
import {dangerName, dangerValue} from 'components/helpers/dangerText';
import {Body, BodyBlack, BodySmBlack, BodyXSm, BodyXSmBlack} from 'components/text';
import {AvalancheDangerForecast, DangerLevel, ElevationBandNames, ForecastPeriod} from 'types/nationalAvalancheCenter';
import {utcDateToLocalDateString} from 'utils/date';

import {AvalancheDangerIcon, iconSize} from 'components/AvalancheDangerIcon';
import {AvalancheDangerTriangle} from 'components/AvalancheDangerTriangle';

export type DangerTableSize = 'main' | 'outlook';

export interface AvalancheDangerTableProps {
  date?: Date;
  forecast?: AvalancheDangerForecast;
  elevation_band_names?: ElevationBandNames;
  size: DangerTableSize;
}

const defaultDanger: AvalancheDangerForecast = {
  lower: DangerLevel.None,
  middle: DangerLevel.None,
  upper: DangerLevel.None,
  valid_day: ForecastPeriod.Current,
};

const defaultElevationBands: ElevationBandNames = {
  upper: 'Above Treeline',
  middle: 'Above Treeline',
  lower: 'Above Treeline',
};

export const AvalancheDangerTable: React.FunctionComponent<AvalancheDangerTableProps> = ({date, forecast, elevation_band_names, size}: AvalancheDangerTableProps) => {
  const {height, marginLeft} = {
    main: {
      height: 200,
      marginLeft: 24,
    },
    outlook: {
      height: 150,
      marginLeft: 48,
    },
  }[size];

  const danger = forecast ?? defaultDanger;
  const maxIconWidth = Math.max(...[danger.lower, danger.middle, danger.upper].map(d => iconSize(d ?? DangerLevel.None).width));

  return (
    <VStack space={12} alignItems="stretch">
      {date && <BodySmBlack>{utcDateToLocalDateString(date)}</BodySmBlack>}
      <View height={height} width="100%">
        {/* This view contains 3 layers stacked over each other: the background bars in gray, the avalanche pyramid, and the text labels and icons */}
        <VStack width="100%" height="100%" position="absolute" justifyContent="space-evenly" alignItems="stretch" space={4} zIndex={10}>
          <View bg="gray.100" flex={1} />
          <View bg="gray.100" flex={1} />
          <View bg="gray.100" flex={1} />
        </VStack>
        <View width="100%" height="100%" position="absolute" zIndex={20}>
          <AvalancheDangerTriangle forecast={danger} height="100%" style={{marginLeft: marginLeft}} />
        </View>
        <VStack width="100%" height="100%" position="absolute" justifyContent="space-evenly" alignItems="stretch" space={4} zIndex={30}>
          {(['upper', 'middle', 'lower'] as const).map((layer, index) => (
            <HStack flex={1} justifyContent="space-between" flexDirection={elevation_band_names ? 'row' : 'row-reverse'} key={index} paddingHorizontal={4}>
              {elevation_band_names &&
                (() => {
                  const [bandName, elevation] = (elevation_band_names[layer] ?? defaultElevationBands[layer]).replace('<br>', '\n').split('\n');
                  return (
                    <View my={4} ml={4} p={4} minWidth={100} justifyContent="center" bg="white">
                      <BodyXSmBlack>{bandName}</BodyXSmBlack>
                      {elevation && <BodyXSm>{elevation}</BodyXSm>}
                    </View>
                  );
                })()}
              <HStack space={8} alignItems="center" px={1}>
                <View my={4} px={1} justifyContent="center">
                  <HStack style={{paddingHorizontal: 4}} space={2}>
                    <BodyBlack>{dangerValue(danger[layer])}</BodyBlack>
                    <Body>- {dangerName(danger[layer])}</Body>
                  </HStack>
                </View>
                {(() => {
                  const size = iconSize(danger[layer]);
                  const scale = 32.0 / size.height;
                  const rightMargin = Math.max(0, maxIconWidth - size.width) * scale;
                  return <AvalancheDangerIcon style={{height: 32, marginRight: rightMargin}} level={danger[layer]} />;
                })()}
              </HStack>
            </HStack>
          ))}
        </VStack>
      </View>
    </VStack>
  );
};
