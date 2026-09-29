import React, {useCallback, useMemo} from 'react';

import {FillLayer, LineLayer, ShapeSource} from '@rnmapbox/maps';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {ZONE_OUTLINE_COLOR, ZONE_OUTLINE_WIDTH} from 'components/map/zonePolygonStyle';
import {CanadaMapViewZone} from 'utils/canadaMapViewZone';

const CANADA_FILL_OPACITY = 0.5;

export interface CanadaAvalancheForecastZonePolygonsProps {
  zones: CanadaMapViewZone[];
  renderFillColor: boolean;
  onPress?: (zone: CanadaMapViewZone) => void;
}

const CanadaAvalancheForecastZonePolygonsComponent: React.FunctionComponent<CanadaAvalancheForecastZonePolygonsProps> = ({
  zones,
  renderFillColor,
  onPress,
}: CanadaAvalancheForecastZonePolygonsProps) => {
  const shape: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        ...zone.feature,
        properties: {...zone.feature.properties, fillColor: colorFor(zone.danger_level).alpha(CANADA_FILL_OPACITY).string()},
      })),
    }),
    [zones],
  );

  const onPolygonPress = useCallback(
    (event: {features: GeoJSON.Feature[]}) => {
      const pressedId = event.features[0]?.properties?.id as string | undefined;
      const zone = zones.find(candidate => candidate.zone_id === pressedId);
      if (zone && onPress) {
        onPress(zone);
      }
    },
    [zones, onPress],
  );

  if (zones.length === 0) {
    return null;
  }

  return (
    <ShapeSource id="canada-zones" shape={shape} onPress={onPolygonPress} hitbox={{width: 0, height: 0}}>
      <FillLayer id="canada-zones-fillLayer" style={{fillColor: ['get', 'fillColor'], visibility: renderFillColor ? 'visible' : 'none'}} />
      <LineLayer id="canada-zones-lineLayer" style={{lineColor: ZONE_OUTLINE_COLOR.toString(), lineWidth: ZONE_OUTLINE_WIDTH}} />
    </ShapeSource>
  );
};

// The zones come from useCanadaZones, which keeps their identity between renders, so memoizing here keeps
// the large carved MultiPolygons from being handed back to Mapbox every time the map re-renders.
export const CanadaAvalancheForecastZonePolygons = React.memo(CanadaAvalancheForecastZonePolygonsComponent);
