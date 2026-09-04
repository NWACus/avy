import {View} from 'components/core';
import {BodySm} from 'components/text';
import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';

const LABEL = 'Why are there overlapping forecasts here?';

const styles = StyleSheet.create({
  label: {
    textDecorationLine: 'underline',
  },
});

export const CBACOverlappingForecastsLink: React.FunctionComponent<{onPress: () => void}> = ({onPress}) => (
  <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={LABEL}>
    <View pt={4} pb={4}>
      <BodySm textAlign="center" color="text.tertiary" style={styles.label}>
        {LABEL}
      </BodySm>
    </View>
  </TouchableOpacity>
);
