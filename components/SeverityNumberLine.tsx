import React from 'react';

import {StyleSheet, Text, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

export interface SeverityNumberLineRange {
  from: number;
  to: number;
}

export interface SeverityNumberLineProps {
  labels: string[];
  range: SeverityNumberLineRange;
}

export const SeverityNumberLine: React.FunctionComponent<SeverityNumberLineProps> = ({labels, range}: SeverityNumberLineProps) => {
  const labelStyle = (item: number): any => {
    if (range.from <= item && range.to >= item) {
      return styles.active;
    }
    return styles.inactive;
  };

  const padding: number = 5;
  const strokeWidth: number = 2;
  const axisHeight: number = 200;
  const y = (index: number): number => {
    return padding + strokeWidth / 2 + axisHeight * (index / (labels.length - 1));
  };
  const rangePadding: number = 4;
  const yBetween: number = y(range.to) - y(range.from) + rangePadding * 2;
  return (
    <View style={styles.container}>
      <View style={{height: '80%'}}>
        <Svg
          style={styles.line}
          viewBox={`0 0 25 ${2 * padding + strokeWidth + axisHeight}`}
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          strokeLinecap={'round'}
          strokeLinejoin={'round'}
          strokeMiterlimit={1.5}>
          {labels.map((label, index) => {
            return <Path key={`marker-${label}`} stroke={'rgb(81,85,88)'} strokeWidth={strokeWidth} d={`M0,${y(index)}l25,0Z`} />;
          })}
          <Path stroke={'rgb(81,85,88)'} strokeWidth={strokeWidth} d={'M12.5,6l0,200Z'} />
          <Path stroke={'rgb(81,85,88)'} strokeWidth={strokeWidth} fill={'rgb(200, 202, 206)'} d={`M0,${y(range.from) - rangePadding}l25,0l0,${yBetween}l-25,0l0,${-yBetween}Z`} />
        </Svg>
      </View>
      <View style={{justifyContent: 'space-between', height: '83%'}}>
        {labels.map((label, index) => (
          <View key={`label-${label}`}>
            <Text style={labelStyle(index)}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 4 / 5,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: {
    fontWeight: 'bold',
    color: 'rgb(30,35,38)',
  },
  inactive: {
    color: 'rgb(168,170,172)',
  },
  line: {
    height: '100%',
    aspectRatio: 25 / 200,
    marginRight: 4,
  },
});
