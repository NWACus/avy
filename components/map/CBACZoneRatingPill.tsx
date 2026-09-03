import React, {useMemo} from 'react';

import {MarkerView} from '@rnmapbox/maps';
import centroid from '@turf/centroid';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {HStack, View} from 'components/core';
import {dangerValue} from 'components/helpers/dangerText';
import {MapViewZone} from 'components/map/ZoneMap';
import {BodyXSm, BodyXSmBlack} from 'components/text';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {colorLookup} from 'theme';
import {DangerLevel} from 'types/nationalAvalancheCenter';

const FADE_DURATION_MS = 200;

const hasRating = (level: DangerLevel | undefined): boolean =>
  level === DangerLevel.Low || level === DangerLevel.Moderate || level === DangerLevel.Considerable || level === DangerLevel.High || level === DangerLevel.Extreme;

export const CBACZoneRatingPill: React.FunctionComponent<{zone: MapViewZone}> = ({zone}) => {
  const coordinate = useMemo(() => centroid(zone.feature.geometry).geometry.coordinates, [zone.feature.geometry]);
  const swatchStyle = useMemo(() => ({backgroundColor: colorFor(zone.danger_level).string()}), [zone.danger_level]);

  return (
    <MarkerView id={`${zone.zone_id}-ratingPill`} coordinate={coordinate} anchor={{x: 0.5, y: 0.5}} allowOverlap allowOverlapWithPuck isSelected={false}>
      <Animated.View entering={FadeIn.duration(FADE_DURATION_MS)} exiting={FadeOut.duration(FADE_DURATION_MS)} pointerEvents="none">
        <HStack bg="rgba(255, 255, 255, 0.92)" borderRadius={12} px={8} py={4} space={6} alignItems="center">
          <View width={12} height={12} borderRadius={2} borderWidth={0.5} borderColor={colorLookup('text')} style={swatchStyle} />
          <BodyXSmBlack>CBAC</BodyXSmBlack>
          <BodyXSm>{hasRating(zone.danger_level) ? dangerValue(zone.danger_level ?? null) : 'No rating'}</BodyXSm>
        </HStack>
      </Animated.View>
    </MarkerView>
  );
};
