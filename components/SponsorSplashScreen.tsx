import React, {useCallback, useEffect, useState} from 'react';

import {ActivityIndicator, Image, StyleSheet, Text, View} from 'react-native';
import Animated, {Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming} from 'react-native-reanimated';

const SPLASH_BACKGROUND_COLOR = '#152E57';

const LOGO_WIDTH = 72;
const LOGO_HEIGHT = 57;
const DIVIDER_WIDTH = 150;
const DIVIDER_TOP_MARGIN = 64;
const PARTNERSHIP_TOP_MARGIN = 24;
const PARTNERSHIP_LINE_HEIGHT = 14;
const SPONSOR_LOGO_WIDTH = 150;
const SPONSOR_LOGO_HEIGHT = 44;
const SPONSOR_LOGO_TOP_MARGIN = 20;

// The content is vertically centered, so the logo rests above the screen center by half the
// block. Starting it that far down places it at the center to match the native splash screen.
const CONTENT_BLOCK_HEIGHT =
  LOGO_HEIGHT + DIVIDER_TOP_MARGIN + StyleSheet.hairlineWidth + PARTNERSHIP_TOP_MARGIN + PARTNERSHIP_LINE_HEIGHT + SPONSOR_LOGO_TOP_MARGIN + SPONSOR_LOGO_HEIGHT;
const LOGO_START_OFFSET = (CONTENT_BLOCK_HEIGHT - LOGO_HEIGHT) / 2;

const LOGO_SETTLE_DURATION_MS = 400;
const CONTENT_FADE_DELAY_MS = 120;
const CONTENT_FADE_DURATION_MS = 280;
const FADE_OUT_DURATION_MS = 350;

export interface SponsorSplashScreenProps {
  active: boolean;
  showActivityIndicator: boolean;
  dismissed: boolean;
  onComplete: () => void;
}

export const SponsorSplashScreen: React.FC<SponsorSplashScreenProps> = ({active, showActivityIndicator, dismissed, onComplete}) => {
  const opacity = useSharedValue(1);
  const logoTranslateY = useSharedValue(LOGO_START_OFFSET);
  const contentOpacity = useSharedValue(0);
  const [hidden, setHidden] = useState(false);

  const handleFadeComplete = useCallback(() => {
    setHidden(true);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!active) {
      return;
    }
    logoTranslateY.value = withTiming(0, {duration: LOGO_SETTLE_DURATION_MS, easing: Easing.out(Easing.cubic)});
    contentOpacity.value = withDelay(CONTENT_FADE_DELAY_MS, withTiming(1, {duration: CONTENT_FADE_DURATION_MS}));
  }, [active, logoTranslateY, contentOpacity]);

  useEffect(() => {
    if (!dismissed) {
      return;
    }
    opacity.value = withTiming(0, {duration: FADE_OUT_DURATION_MS});
    const timeout = setTimeout(handleFadeComplete, FADE_OUT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [dismissed, opacity, handleFadeComplete]);

  const rootStyle = useAnimatedStyle(() => ({opacity: opacity.value}));
  const logoStyle = useAnimatedStyle(() => ({transform: [{translateY: logoTranslateY.value}]}));
  const contentStyle = useAnimatedStyle(() => ({opacity: contentOpacity.value}));

  if (hidden) {
    return null;
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, {backgroundColor: SPLASH_BACKGROUND_COLOR}, rootStyle]}>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Animated.View style={logoStyle}>
          <Image
            style={{width: LOGO_WIDTH, height: LOGO_HEIGHT}}
            resizeMode="contain"
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
            source={require('../assets/avy-logo-transparent.png')}
          />
        </Animated.View>
        <Animated.View style={[{alignItems: 'center', marginTop: DIVIDER_TOP_MARGIN}, contentStyle]}>
          <View style={{width: DIVIDER_WIDTH, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255, 255, 255, 0.25)'}} />
          <Text
            style={{marginTop: PARTNERSHIP_TOP_MARGIN, fontSize: 11, lineHeight: PARTNERSHIP_LINE_HEIGHT, fontWeight: '600', letterSpacing: 2, color: 'rgba(255, 255, 255, 0.55)'}}>
            IN PARTNERSHIP WITH
          </Text>
          <Image
            style={{width: SPONSOR_LOGO_WIDTH, height: SPONSOR_LOGO_HEIGHT, marginTop: SPONSOR_LOGO_TOP_MARGIN}}
            resizeMode="contain"
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
            source={require('../assets/logos/Nokian_Tyres_Snow.png')}
          />
        </Animated.View>
      </View>
      {showActivityIndicator && (
        <View style={{position: 'absolute', bottom: 96, left: 0, right: 0, alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </Animated.View>
  );
};
