import React, {useCallback, useEffect, useMemo, useRef} from 'react';

import {FillLayer, FillLayerStyle, LineLayer, LineLayerStyle, ShapeSource} from '@rnmapbox/maps';
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

export const DEFAULT_LINE_STYLE: LineLayerStyle = {lineColor: colorLookup('gray.700').toString(), lineWidth: 2, lineCap: 'butt', lineJoin: 'miter'};
const COVERAGE_EDGE_LINE_STYLE: LineLayerStyle = {lineColor: 'white', lineWidth: COVERAGE_EDGE_LINE_WIDTH, lineCap: 'round', lineJoin: 'round'};
const COVERAGE_EDGE_DASH_STYLE: LineLayerStyle = {
  lineColor: colorLookup('gray.900').toString(),
  lineWidth: COVERAGE_EDGE_LINE_WIDTH,
  lineDasharray: COVERAGE_EDGE_DASH_ARRAY,
  lineCap: 'butt',
  lineJoin: 'round',
};

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
  // Matches the filter WarningPulseOverlay uses to pick up zones, so the resting colour below the pulse
  // agrees with whether a pulse is actually painted on top of it.
  const pulses = zone.hasWarning && renderFillColor && !isCoverageEdge;

  // ShapeSource is a PureComponent whose render re-serializes the whole geometry with JSON.stringify.
  // Both of its unstable props are held stable here so it can short-circuit: the zone is read through a
  // ref rather than closed over, and the layers are memoized rather than built as a fresh array literal.
  const zoneRef = useRef(zone);
  useEffect(() => {
    zoneRef.current = zone;
  }, [zone]);

  const onPolygonPress = useCallback(
    (_: object) => {
      if (onPress) {
        onPress(zoneRef.current);
      }
    },
    [onPress],
  );

  let fillOpacity: number;
  if (isCoverageEdge) {
    fillOpacity = COVERAGE_EDGE_FILL_OPACITY;
  } else if (polygonStyle === 'opaqueFill') {
    fillOpacity = 1;
  } else {
    fillOpacity = zone.fillOpacity;
  }

  // Mapbox multiplies fillOpacity by the fill color's alpha, so exactly one of them carries the opacity:
  // the color stays opaque and fillOpacity does the work.
  //
  // opaqueFill is the exception. It exists to hide the overlapping center's polygon, so it cannot fade
  // with alpha — which leaves it nowhere to pulse from. A pulsing opaqueFill zone therefore rests on a
  // lightened version of its color and the overlay flashes it back to full strength; one that isn't
  // pulsing just paints its color outright.
  const fillColor = useMemo(() => {
    const base = colorFor(zone.danger_level);
    return polygonStyle === 'opaqueFill' && pulses ? base.mix(Color('white'), 1 - zone.fillOpacity).string() : base.string();
  }, [zone.danger_level, zone.fillOpacity, polygonStyle, pulses]);

  const fillStyle = useMemo<FillLayerStyle>(
    () => ({
      fillColor: fillColor,
      fillOpacity: fillOpacity,
      visibility: isCoverageEdge || renderFillColor ? 'visible' : 'none',
    }),
    [fillColor, fillOpacity, isCoverageEdge, renderFillColor],
  );

  // Every layer has to be a direct child of ShapeSource — it injects its source id per child and skips
  // over Fragments.
  const layers = useMemo(
    () => [
      <FillLayer key="fillLayer" id={`${zone.zone_id}-fillLayer`} style={fillStyle} />,
      <LineLayer key="lineLayer" id={`${zone.zone_id}-lineLayer`} style={isCoverageEdge ? COVERAGE_EDGE_LINE_STYLE : DEFAULT_LINE_STYLE} />,
      ...(isCoverageEdge ? [<LineLayer key="coverageEdgeDashLayer" id={`${zone.zone_id}-coverageEdgeDashLayer`} style={COVERAGE_EDGE_DASH_STYLE} />] : []),
    ],
    [zone.zone_id, fillStyle, isCoverageEdge],
  );

  return (
    <ShapeSource id={`${zone.zone_id}`} shape={zone.feature} onPress={onPolygonPress} hitbox={HITBOX}>
      {layers}
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
