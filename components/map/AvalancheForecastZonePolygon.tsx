import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {Animated} from 'react-native';

import {LineLayer, Animated as MBAnimated, ShapeSource} from '@rnmapbox/maps';
import Color from 'color';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {MapViewZone} from 'components/map/ZoneMap';
import {colorLookup} from 'theme';

export type ZonePolygonStyle = 'default' | 'coverageEdge' | 'opaqueFill';

const COVERAGE_EDGE_LINE_WIDTH = 6;
const COVERAGE_EDGE_DASH_ARRAY = [1, 1];
// Mapbox will not hit-test a layer painted at exactly zero opacity, so the coverage edge fill uses the
// smallest opacity that still registers a tap. It is imperceptible on screen.
const COVERAGE_EDGE_FILL_OPACITY = 0.01;

const HITBOX = {width: 0, height: 0};

const DEFAULT_LINE_STYLE = {lineColor: colorLookup('gray.700').toString(), lineWidth: 2, lineCap: 'butt', lineJoin: 'miter'} as const;
const COVERAGE_EDGE_LINE_STYLE = {lineColor: 'white', lineWidth: COVERAGE_EDGE_LINE_WIDTH, lineCap: 'round', lineJoin: 'round'} as const;
const COVERAGE_EDGE_DASH_STYLE = {
  lineColor: colorLookup('gray.900').toString(),
  lineWidth: COVERAGE_EDGE_LINE_WIDTH,
  lineDasharray: COVERAGE_EDGE_DASH_ARRAY,
  lineCap: 'butt',
  lineJoin: 'round',
} as const;

export interface AvalancheForecastZonePolygonProps {
  zone: MapViewZone;
  renderFillColor: boolean;
  polygonStyle?: ZonePolygonStyle;
  onPress?: (zone: MapViewZone) => void;
}

const AvalancheForecastZonePolygonComponent: React.FunctionComponent<AvalancheForecastZonePolygonProps> = ({
  zone,
  onPress,
  renderFillColor,
  polygonStyle = 'default',
}: AvalancheForecastZonePolygonProps) => {
  const isCoverageEdge = polygonStyle === 'coverageEdge';
  const useAnimation = zone.hasWarning && renderFillColor && !isCoverageEdge;
  const animationProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!useAnimation) {
      return;
    }
    const animation = Animated.loop(
      Animated.timing(animationProgress, {
        toValue: 3,
        duration: 2000,
        useNativeDriver: false,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
      animationProgress.setValue(0);
    };
  }, [animationProgress, useAnimation]);

  const onPolygonPress = useCallback(
    (_: object) => {
      if (onPress) {
        onPress(zone);
      }
    },
    [zone, onPress],
  );

  // Mapbox multiplies fillOpacity by the fill color's alpha, so exactly one of them carries the opacity: static styles put it on fillOpacity and keep
  // the color opaque, while animated styles pin fillOpacity to 1 and pulse the color instead.
  let fillOpacity: number;
  if (isCoverageEdge) {
    fillOpacity = COVERAGE_EDGE_FILL_OPACITY;
  } else if (useAnimation || polygonStyle === 'opaqueFill') {
    fillOpacity = 1;
  } else {
    fillOpacity = zone.fillOpacity;
  }

  const staticFillColor = useMemo(() => colorFor(zone.danger_level).string(), [zone.danger_level]);
  const animatedFillColor = useMemo(() => {
    const base = colorFor(zone.danger_level);
    const vivid = base.alpha(1).string();
    // opaqueFill exists to hide the overlapping center's polygon, so its flash lightens the color at full
    // alpha. Fading to fillOpacity the way every other zone does would let that polygon show through.
    const muted = polygonStyle === 'opaqueFill' ? base.mix(Color('white'), 1 - zone.fillOpacity).string() : base.alpha(zone.fillOpacity).string();
    return animationProgress.interpolate({
      inputRange: [0, 1, 2, 3, 4, 5],
      outputRange: [muted, muted, vivid, vivid, muted, muted],
    });
  }, [animationProgress, zone.danger_level, zone.fillOpacity, polygonStyle]);

  const fillStyle = useMemo(
    () => ({
      fillColor: useAnimation ? animatedFillColor : staticFillColor,
      fillOpacity: fillOpacity,
      visibility: isCoverageEdge || renderFillColor ? 'visible' : 'none',
    }),
    [useAnimation, animatedFillColor, staticFillColor, fillOpacity, isCoverageEdge, renderFillColor],
  );

  // Every layer has to be a direct child of ShapeSource — it injects its source id per child and skips
  // over Fragments.
  return (
    <ShapeSource key={`${zone.zone_id}`} id={`${zone.zone_id}`} shape={zone.feature} onPress={onPolygonPress} hitbox={HITBOX}>
      {[
        <MBAnimated.FillLayer key="fillLayer" id={`${zone.zone_id}-fillLayer`} style={fillStyle} />,
        <LineLayer key="lineLayer" id={`${zone.zone_id}-lineLayer`} style={isCoverageEdge ? COVERAGE_EDGE_LINE_STYLE : DEFAULT_LINE_STYLE} />,
        ...(isCoverageEdge ? [<LineLayer key="coverageEdgeDashLayer" id={`${zone.zone_id}-coverageEdgeDashLayer`} style={COVERAGE_EDGE_DASH_STYLE} />] : []),
      ]}
    </ShapeSource>
  );
};

export const AvalancheForecastZonePolygon = React.memo(AvalancheForecastZonePolygonComponent);
AvalancheForecastZonePolygon.displayName = 'AvalancheForecastZonePolygon';

export const SelectedAvalancheForecastZonePolygon: React.FunctionComponent<{zone: MapViewZone}> = ({zone}) => {
  const highlight = colorLookup('blue.100');

  return (
    <ShapeSource key={`${zone.zone_id}-selected`} id={`${zone.zone_id}-selected`} shape={zone.feature}>
      <LineLayer id={`${zone.zone_id}-lineLayer-selected`} style={{lineColor: highlight.toString(), lineWidth: 4}} />
    </ShapeSource>
  );
};
