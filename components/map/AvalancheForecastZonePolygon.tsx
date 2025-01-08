import React, {useEffect, useRef} from 'react';
import {Animated} from 'react-native';
import {Geojson, GeojsonProps, LatLng} from 'react-native-maps';

import {colorFor} from 'components/AvalancheDangerTriangle';
import {MapViewZone} from 'components/content/ZoneMap';
import {colorLookup} from 'theme';
import {Geometry} from 'types/nationalAvalancheCenter';

const coordinateList = (geometry: Geometry): number[][] => {
  let items: number[][] = [];
  if (geometry.type === 'Polygon') {
    items = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    items = geometry.coordinates[0][0];
  }
  return items;
};

const toLatLng = (item: number[]): LatLng => {
  return {longitude: item[0], latitude: item[1]};
};

export const toLatLngList = (geometry: Geometry | undefined): LatLng[] => {
  if (!geometry) {
    return [];
  }
  return coordinateList(geometry).map(toLatLng);
};

export interface AvalancheForecastZonePolygonProps {
  zone: MapViewZone;
  selected: boolean;
  renderFillColor: boolean;
  onPress?: (zone: MapViewZone) => void;
}

const AnimatedGeojson = Animated.createAnimatedComponent(Geojson);

export const AvalancheForecastZonePolygon: React.FunctionComponent<AvalancheForecastZonePolygonProps> = ({
  zone,
  selected,
  onPress,
  renderFillColor,
}: AvalancheForecastZonePolygonProps) => {
  const outline = colorLookup('gray.700');
  const highlight = colorLookup('blue.100');
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

  const polygonProps: GeojsonProps = {
    geojson: {
      type: 'FeatureCollection',
      features: [zone.feature],
    },
    strokeColor: selected ? highlight.toString() : outline.toString(),
    strokeWidth: selected ? 4 : 2,
    tappable: onPress !== undefined,
    zIndex: selected ? 1 : 0,
    onPress: (_event: Parameters<Required<GeojsonProps>['onPress']>[0]) => {
      if (onPress) {
        onPress(zone);
      }
    },
  };

  if (useAnimation) {
    const fillColor = animationProgress.interpolate({
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
    return <AnimatedGeojson fillColor={fillColor} {...polygonProps} />;
  } else {
    const fillOpacity = renderFillColor ? zone.fillOpacity : 0;
    const fillColor = colorFor(zone.danger_level).alpha(fillOpacity).string();
    return <Geojson fillColor={fillColor} {...polygonProps} />;
  }
};
