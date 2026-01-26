import React, {useCallback, useEffect, useRef} from 'react';
import {Animated} from 'react-native';

import {LineLayer, Animated as MBAnimated, ShapeSource} from '@rnmapbox/maps';
import {OnPressEvent} from '@rnmapbox/maps/lib/typescript/src/types/OnPressEvent';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {MapViewZone} from 'components/content/ZoneMap';
import {colorLookup} from 'theme';

export interface AvalancheForecastZonePolygonProps {
  zone: MapViewZone;
  renderFillColor: boolean;
  onPress?: (zone: MapViewZone) => void;
}

export const AvalancheForecastZonePolygon: React.FunctionComponent<AvalancheForecastZonePolygonProps> = ({zone, onPress, renderFillColor}: AvalancheForecastZonePolygonProps) => {
  const outline = colorLookup('gray.700');
  const useAnimation = zone.hasWarning && renderFillColor;
  const animationProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (useAnimation) {
      Animated.loop(
        Animated.timing(animationProgress, {
          toValue: 3,
          duration: 2000,
          useNativeDriver: false,
        }),
      ).start();
    }
  }, [animationProgress, useAnimation]);

  const onPolygonPress = useCallback(
    (_: OnPressEvent) => {
      if (onPress) {
        onPress(zone);
      }
    },
    [zone, onPress],
  );

  const fillOpacity = renderFillColor ? zone.fillOpacity : 0;
  let fillColor: string | Animated.AnimatedInterpolation<string | number>;
  if (useAnimation) {
    fillColor = animationProgress.interpolate({
      inputRange: [0, 1, 2, 3, 4, 5],
      outputRange: [
        colorFor(zone.danger_level).alpha(zone.fillOpacity).string(),
        colorFor(zone.danger_level).alpha(zone.fillOpacity).string(),
        colorFor(zone.danger_level).alpha(1).string(),
        colorFor(zone.danger_level).alpha(1).string(),
        colorFor(zone.danger_level).alpha(zone.fillOpacity).string(),
        colorFor(zone.danger_level).alpha(zone.fillOpacity).string(),
      ],
    });
  } else {
    fillColor = colorFor(zone.danger_level).alpha(fillOpacity).string();
  }

  return (
    <ShapeSource key={`${zone.zone_id}`} id={`${zone.zone_id}`} shape={zone.feature} onPress={onPolygonPress} hitbox={{width: 0, height: 0}}>
      <MBAnimated.FillLayer id={`${zone.zone_id}-fillLayer`} style={{fillColor: fillColor, visibility: renderFillColor ? 'visible' : 'none'}} />
      <LineLayer id={`${zone.zone_id}-lineLayer`} style={{lineColor: outline.toString(), lineWidth: 2}} />
    </ShapeSource>
  );
};

export const SelectedAvalancheForecastZonePolygon: React.FunctionComponent<{zone: MapViewZone}> = ({zone}) => {
  const highlight = colorLookup('blue.100');

  return (
    <ShapeSource key={`${zone.zone_id}-selected`} id={`${zone.zone_id}-selected`} shape={zone.feature}>
      <LineLayer id={`${zone.zone_id}-lineLayer-selected`} style={{lineColor: highlight.toString(), lineWidth: 4}} />
    </ShapeSource>
  );
};
