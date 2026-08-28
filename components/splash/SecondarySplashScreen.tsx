import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';

import {AndroidSplashScreen} from 'components/splash/AndroidSplashScreen';
import {IOSSplashScreen} from 'components/splash/IOSSplashScreen';

// Mirrors the expo-splash-screen plugin config in app.json. SDK 56 removed the top-level
// `splash` field from the Expo config, so it's no longer readable via Constants.expoConfig.splash;
// the per-platform variants keep their layouts in sync with that config by hand.
export const SPLASH_BACKGROUND_COLOR = '#152E57';

export const SecondarySplashScreen: React.FunctionComponent = () => (
  <View pointerEvents="none" style={styles.root}>
    {Platform.OS === 'android' ? <AndroidSplashScreen /> : <IOSSplashScreen />}
  </View>
);

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
