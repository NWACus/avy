import Topo from 'assets/illustrations/topo.svg';
import {View} from 'components/core';
import {Title1Black} from 'components/text';
import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {colorLookup} from 'theme';

const BANNER_HEIGHT = 90;
const TOPO_DISPLAY_HEIGHT = BANNER_HEIGHT * 1.6;
const TOPO_DISPLAY_WIDTH = TOPO_DISPLAY_HEIGHT * 2;

export const NoCenterDrawerHeader: React.FunctionComponent = () => (
  <View style={styles.container}>
    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
    <Image source={require('assets/avy-logo-transparent.png')} style={styles.icon} />
    <Title1Black color={colorLookup('NWAC-light')} letterSpacing={4}>
      AVY
    </Title1Black>
    <Topo width={TOPO_DISPLAY_WIDTH} height={TOPO_DISPLAY_HEIGHT} style={styles.topo} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: BANNER_HEIGHT,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 12,
  },
  icon: {
    height: 52,
    width: 52,
    resizeMode: 'contain',
  },
  topo: {
    position: 'absolute',
    right: -20,
    bottom: -72,
  },
});
