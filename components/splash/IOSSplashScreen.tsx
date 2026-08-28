import React from 'react';
import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';

const SPLASH_IMAGE_WIDTH = 200;
const INDICATOR_GAP = 24;
const INDICATOR_SLOT_HEIGHT = 60;

export const IOSSplashScreen: React.FunctionComponent = () => (
  <>
    <View style={styles.spacer} />
    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
    <Image style={styles.splashImage} source={require('assets/splash-ios.png')} />
    <View style={styles.indicatorSlot}>
      <ActivityIndicator size="large" />
    </View>
  </>
);

const styles = StyleSheet.create({
  spacer: {
    height: INDICATOR_SLOT_HEIGHT,
  },
  splashImage: {
    width: SPLASH_IMAGE_WIDTH,
    height: SPLASH_IMAGE_WIDTH,
    resizeMode: 'contain',
  },
  indicatorSlot: {
    height: INDICATOR_SLOT_HEIGHT,
    paddingTop: INDICATOR_GAP,
    alignItems: 'center',
  },
});
