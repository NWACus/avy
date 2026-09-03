import React from 'react';
import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';

const ICON_WIDTH = 288;
const BRANDING_WIDTH = 200;
const BRANDING_HEIGHT = 80;
const BRANDING_BOTTOM_OFFSET = 60;
const INDICATOR_BOTTOM_GAP = 24;

export const AndroidSplashScreen: React.FunctionComponent = () => (
  <>
    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
    <Image style={styles.icon} source={require('assets/adaptive-icon.png')} />
    <View style={styles.indicatorContainer}>
      <ActivityIndicator size="large" />
    </View>
    <View style={styles.brandingContainer}>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
      <Image style={styles.branding} source={require('assets/splash-branding-android.png')} />
    </View>
  </>
);

const styles = StyleSheet.create({
  icon: {
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    resizeMode: 'contain',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: BRANDING_BOTTOM_OFFSET + BRANDING_HEIGHT + INDICATOR_BOTTOM_GAP,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  brandingContainer: {
    position: 'absolute',
    bottom: BRANDING_BOTTOM_OFFSET,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  branding: {
    width: BRANDING_WIDTH,
    height: BRANDING_HEIGHT,
    resizeMode: 'contain',
  },
});
