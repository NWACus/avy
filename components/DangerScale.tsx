import React from 'react';

import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';

import {DangerLevel} from 'types/nationalAvalancheCenter';
import {colorFor} from './AvalancheDangerPyramid';
import {dangerShortText} from './helpers/dangerText';

export interface DangerScaleProps {
  style?: ViewStyle;
}

export const DangerScale: React.FunctionComponent<DangerScaleProps> = ({style}: DangerScaleProps) => {
  return (
    <View style={{...styles.legend, ...style}}>
      <View style={styles.legendHeader}>
        <Text style={styles.legendTitle}>Danger Scale</Text>
        <FontAwesome5 name="info-circle" size={16} color="blue" />
      </View>
      <View style={styles.legendItems}>
        {Object.keys(DangerLevel)
          .filter(key => Number.isNaN(+key))
          .filter(key => DangerLevel[key] > DangerLevel.None)
          .map(key => DangerLevel[key])
          .map(level => (
            <View
              key={level}
              style={{
                ...styles.legendColor,
                backgroundColor: colorFor(level).alpha(0.85).string(),
                borderBottomLeftRadius: level === DangerLevel.Low ? 4 : 0,
                borderTopLeftRadius: level === DangerLevel.Low ? 4 : 0,
                borderBottomRightRadius: level === DangerLevel.Extreme ? 4 : 0,
                borderTopRightRadius: level === DangerLevel.Extreme ? 4 : 0,
              }}
            />
          ))}
      </View>
      <View style={styles.legendItems}>
        {Object.keys(DangerLevel)
          .filter(key => Number.isNaN(+key))
          .filter(key => DangerLevel[key] > DangerLevel.None)
          .map(key => DangerLevel[key])
          .map(level => (
            <Text key={level} style={styles.legendText}>
              {dangerShortText(level)}
            </Text>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  legendHeader: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  legendTitle: {
    flex: 0,
    padding: 8,
    fontWeight: 'bold',
  },
  legendIcon: {
    flex: 0,
    width: 16,
    height: 16,
  },
  legendItems: {
    marginLeft: 8,
    marginRight: 8,
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  legendColor: {
    flex: 1,
    height: 16,
  },
  legendText: {
    flex: 1,
    padding: 2,
    color: 'black',
    textAlign: 'center',
    fontSize: 10,
  },
});
