// Title-sponsor watermark for the map view: a small logo chip pinned bottom-right (clear of the
// Mapbox attribution bottom-left). Once per session — after the splash finishes and no first-run
// modal is covering the map — it springs open into a "BROUGHT TO YOU BY" card with a larger
// sponsor graphic, holds while a thin bottom bar drains as a countdown, then collapses back to
// the chip. Tapping the chip replays the expansion; tapping the expanded card opens the sponsor
// campaign URL.
import React, {useCallback, useEffect, useMemo, useRef} from 'react';

import {sponsorLogoSize} from 'data/sponsors';
import * as WebBrowser from 'expo-web-browser';
import {useAnalytics} from 'hooks/useAnalytics';
import {useTitleSponsor} from 'hooks/useTitleSponsor';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {Alert, Image, ImageResolvedAssetSource, Text, TouchableOpacity, View} from 'react-native';
import Animated, {Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming} from 'react-native-reanimated';
import {colorLookup} from 'theme';

// Underdamped springs so size changes overshoot and bounce once before settling. The collapse
// spring is slightly calmer: its undershoot dips the pill below chip size, which clips the logo,
// so it gets more damping than the expand.
const EXPAND_SPRING = {damping: 13, stiffness: 190, mass: 1};
const COLLAPSE_SPRING = {damping: 15, stiffness: 190, mass: 1};

// Approximate visual settle time of EXPAND_SPRING — the drain and auto-collapse timers key off this.
const EXPAND_MS = 460;
const HOLD_MS = 2200;

const COLLAPSED_WIDTH = 68;
const COLLAPSED_HEIGHT = 40;
const EXPANDED_WIDTH = 168;
const EXPANDED_HEIGHT = 92;
const PILL_RADIUS = 20;

// Countdown drain: a thin bar along the pill's flat bottom edge (inset past the rounded corners)
// that shrinks toward its center over the hold, so the pill reads as "on a timer" rather than
// permanently parked over the map. Laid out inside the pill so it tracks the spring overshoot.
const TRACE_BAR_HEIGHT = 2;
const TRACE_BAR_BOTTOM = 6;
const TRACE_COLOR = '#9CA3AF';

const COLLAPSED_LOGO_VISIBLE_WIDTH = 50;
const EXPANDED_LOGO_VISIBLE_WIDTH = 116;

// The Nokian logo asset carries transparent padding on both sides (same fractions the first-run
// modal compensates for), so size by the width we want the *visible* mark to occupy.
const LOGO_BLANK_LEFT_FRACTION = 0.107;
const LOGO_BLANK_RIGHT_FRACTION = 0.064;
const LOGO_VISIBLE_FRACTION = 1 - LOGO_BLANK_LEFT_FRACTION - LOGO_BLANK_RIGHT_FRACTION;

const logoStyleForVisibleWidth = (logo: ImageResolvedAssetSource, visibleWidth: number) => {
  const assetWidth = visibleWidth / LOGO_VISIBLE_FRACTION;
  return {...sponsorLogoSize(logo, assetWidth), marginLeft: -assetWidth * LOGO_BLANK_LEFT_FRACTION, marginRight: -assetWidth * LOGO_BLANK_RIGHT_FRACTION};
};

export interface SponsorWatermarkProps {
  tabBarHeight: number;
  // True once the splash is done and no first-run modal is covering the map — the moment the
  // intro animation should auto-play.
  active: boolean;
}

export const SponsorWatermark: React.FC<SponsorWatermarkProps> = ({tabBarHeight, active}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const analytics = useAnalytics();
  const sponsor = useTitleSponsor();
  const collapsedLogoStyle = useMemo(() => logoStyleForVisibleWidth(sponsor.logoOnLight, COLLAPSED_LOGO_VISIBLE_WIDTH), [sponsor.logoOnLight]);
  const expandedLogoStyle = useMemo(() => logoStyleForVisibleWidth(sponsor.logoOnLight, EXPANDED_LOGO_VISIBLE_WIDTH), [sponsor.logoOnLight]);

  const width = useSharedValue(COLLAPSED_WIDTH);
  const height = useSharedValue(COLLAPSED_HEIGHT);
  const collapsedOpacity = useSharedValue(1);
  const expandedOpacity = useSharedValue(0);
  const traceProgress = useSharedValue(0);

  const pillState = useRef<'collapsed' | 'expanded'>('collapsed');
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayed = useRef(false);

  const collapse = useCallback(() => {
    pillState.current = 'collapsed';
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    expandedOpacity.value = withTiming(0, {duration: 180});
    collapsedOpacity.value = withDelay(200, withTiming(1, {duration: 220}));
    width.value = withDelay(120, withSpring(COLLAPSED_WIDTH, COLLAPSE_SPRING));
    height.value = withDelay(120, withSpring(COLLAPSED_HEIGHT, COLLAPSE_SPRING));
  }, [width, height, collapsedOpacity, expandedOpacity]);

  const expand = useCallback(() => {
    pillState.current = 'expanded';
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    width.value = withSpring(EXPANDED_WIDTH, EXPAND_SPRING);
    height.value = withSpring(EXPANDED_HEIGHT, EXPAND_SPRING);
    collapsedOpacity.value = withTiming(0, {duration: 150});
    expandedOpacity.value = withDelay(150, withTiming(1, {duration: 250}));
    traceProgress.value = 0;
    traceProgress.value = withDelay(EXPAND_MS, withTiming(1, {duration: HOLD_MS, easing: Easing.linear}));
    collapseTimer.current = setTimeout(collapse, EXPAND_MS + HOLD_MS);
  }, [width, height, collapsedOpacity, expandedOpacity, traceProgress, collapse]);

  useEffect(() => {
    if (active && !autoPlayed.current) {
      autoPlayed.current = true;
      expand();
    }
  }, [active, expand]);

  useEffect(
    () => () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    },
    [],
  );

  const onPressPill = useCallback(() => {
    if (pillState.current === 'collapsed') {
      analytics.capture('sponsorWatermarkTapped');
      expand();
    } else {
      analytics.capture('vistSponsorURLTapped', {eventOrigin: 'mapWatermark'});
      WebBrowser.openBrowserAsync(sponsor.campaignUrl).catch((e: unknown) => {
        logger.error({error: e}, 'Failed to open title sponsor URL');
        Alert.alert('Unable to Open Web Browser', 'An error occured when trying to open the web browser. Please try again.', [
          {
            text: 'Okay',
            style: 'default',
          },
        ]);
      });
    }
  }, [analytics, expand, logger, sponsor.campaignUrl]);

  const pillStyle = useAnimatedStyle(() => ({width: width.value, height: height.value}));
  const collapsedStyle = useAnimatedStyle(() => ({opacity: collapsedOpacity.value}));
  const expandedStyle = useAnimatedStyle(() => ({opacity: expandedOpacity.value}));
  const traceBarStyle = useAnimatedStyle(() => ({opacity: expandedOpacity.value, transform: [{scaleX: 1 - traceProgress.value}]}));

  return (
    <View pointerEvents="box-none" style={{position: 'absolute', left: 0, right: 0, bottom: tabBarHeight + 12}}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 12,
            bottom: 0,
            backgroundColor: colorLookup('white'),
            borderRadius: PILL_RADIUS,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: {width: 0, height: 2},
            elevation: 4,
          },
          pillStyle,
        ]}>
        <TouchableOpacity activeOpacity={0.85} onPress={onPressPill} style={{flex: 1}}>
          <Animated.View style={[{position: 'absolute', right: 0, top: 0, bottom: 0, width: COLLAPSED_WIDTH, alignItems: 'center', justifyContent: 'center'}, collapsedStyle]}>
            <Text numberOfLines={1} style={{fontSize: 7, fontWeight: '700', letterSpacing: 0.6, color: colorLookup('text.secondary'), marginBottom: 1}}>
              SPONSOR
            </Text>
            <Image source={sponsor.logoOnLight} resizeMode="contain" style={collapsedLogoStyle} />
          </Animated.View>
          <Animated.View style={[{position: 'absolute', right: 0, top: 0, bottom: 0, width: EXPANDED_WIDTH, alignItems: 'center', justifyContent: 'center'}, expandedStyle]}>
            <Text numberOfLines={1} style={{fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colorLookup('text.secondary'), marginBottom: 8}}>
              BROUGHT TO YOU BY
            </Text>
            <Image source={sponsor.logoOnLight} resizeMode="contain" style={expandedLogoStyle} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: PILL_RADIUS,
                right: PILL_RADIUS,
                bottom: TRACE_BAR_BOTTOM,
                height: TRACE_BAR_HEIGHT,
                borderRadius: TRACE_BAR_HEIGHT / 2,
                backgroundColor: TRACE_COLOR,
              },
              traceBarStyle,
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
