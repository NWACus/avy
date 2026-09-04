import React, {useEffect, useMemo, useRef} from 'react';
import {Animated} from 'react-native';

import {FillLayer, FillLayerStyle, LineLayer, ShapeSource} from '@rnmapbox/maps';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {DEFAULT_LINE_STYLE} from 'components/map/AvalancheForecastZonePolygon';
import {MapViewZone} from 'components/map/ZoneMap';
import {DangerLevel} from 'types/nationalAvalancheCenter';

const PULSE_DURATION_MS = 2000;
const PULSE_DANGER_PROPERTY = 'avyDangerLevel';

// A match resolves its literal outputs when the style parses, so the color never has to be coerced from
// a string at runtime. Generated from colorFor so the danger palette still lives in one place.
const DANGER_LEVELS = [DangerLevel.GeneralInformation, DangerLevel.None, DangerLevel.Low, DangerLevel.Moderate, DangerLevel.Considerable, DangerLevel.High, DangerLevel.Extreme];
const PULSE_FILL_COLOR: FillLayerStyle['fillColor'] = [
  'match',
  ['get', PULSE_DANGER_PROPERTY],
  ...DANGER_LEVELS.flatMap(level => [level, colorFor(level).hex()]),
  colorFor(undefined).hex(),
];

// The whole style is rebuilt for every push. RN's Animated integration sends only the properties it
// animates, and AbstractLayer replaces reactStyle wholesale from whatever it is handed — so a partial
// style silently drops fillColor and Mapbox falls back to its default for fill-color, which is black.
const pulseFillStyle = (opacity: number): FillLayerStyle => ({fillColor: PULSE_FILL_COLOR, fillOpacity: opacity});

// Holds muted, ramps to vivid, holds vivid, resets — the shape the per-zone color animation had.
const pulseOpacityFor = (progress: number): number => (progress <= 1 ? 0 : progress >= 2 ? 1 : progress - 1);

export type WarningPulse = Animated.Value;

// Mapbox appends a layer to the top of the style when it is added, so a source that mounts once the
// warnings load would sit above polygons that were already there. Both overlays stay mounted from the
// first render — empty until there is something to pulse — so their place in the draw order is fixed.
export const NO_WARNING_ZONES: GeoJSON.FeatureCollection = {type: 'FeatureCollection', features: []};

// Warning zones pulse everywhere in the country at once, so this has to cost the same whether one zone
// is warning or a hundred are. Every warning zone goes into a shared source painted by a single layer,
// with the color coming from a data-driven expression rather than a per-zone style.
const warningPulseCollection = (zones: MapViewZone[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: zones.map(zone => ({
    type: 'Feature',
    id: zone.zone_id,
    geometry: zone.feature.geometry,
    properties: {[PULSE_DANGER_PROPERTY]: zone.danger_level ?? DangerLevel.None},
  })),
});

// zonesById rebuilds its MapViewZone objects on every render, so the collection is cached against what
// actually shapes it — the zones' ids and danger levels — rather than against array identity. Geometry
// comes through by reference from the cached map layer, so it cannot drift without the id set changing.
// Without this the source's shape prop would be new every render and Mapbox would re-serialize every
// warning polygon along with it.
export const useWarningPulseShape = (zones: MapViewZone[]): GeoJSON.FeatureCollection => {
  const signature = zones.map(zone => `${zone.zone_id}:${zone.danger_level ?? ''}`).join(',');
  const cached = useRef<{signature: string; shape: GeoJSON.FeatureCollection}>({signature: '', shape: NO_WARNING_ZONES});
  if (cached.current.signature !== signature) {
    cached.current = {signature: signature, shape: zones.length > 0 ? warningPulseCollection(zones) : NO_WARNING_ZONES};
  }
  return cached.current.shape;
};

// Held by the map rather than by each overlay so that every overlay pulses off the same clock.
export const useWarningPulse = (enabled: boolean): WarningPulse => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 3,
        duration: PULSE_DURATION_MS,
        useNativeDriver: false,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
      progress.setValue(0);
    };
  }, [progress, enabled]);

  return progress;
};

export const WarningPulseOverlay: React.FunctionComponent<{id: string; shape: GeoJSON.FeatureCollection; pulse: WarningPulse}> = ({id, shape, pulse}) => {
  // Pushed through a listener rather than bound into MBAnimated.FillLayer so that the layer keeps its
  // color, and so that nothing here re-renders — a re-render would rebuild ShapeSource's children and
  // make it re-serialize every warning polygon.
  const fillLayer = useRef<FillLayer>(null);
  useEffect(() => {
    // No reset on teardown: useWarningPulse sets the value back to 0 when it stops, which reaches the
    // layer through this same listener.
    const listenerId = pulse.addListener(({value}) => fillLayer.current?.setNativeProps({style: pulseFillStyle(pulseOpacityFor(value))}));
    return () => pulse.removeListener(listenerId);
  }, [pulse]);

  // No onPress: without a press listener the source registers no hit test, so taps still fall through
  // to the per-zone polygons underneath. The line layer redraws the outlines the fill would cover.
  const layers = useMemo(
    () => [
      <FillLayer key="warningPulseFillLayer" ref={fillLayer} id={`${id}-fillLayer`} style={pulseFillStyle(0)} />,
      <LineLayer key="warningPulseLineLayer" id={`${id}-lineLayer`} style={DEFAULT_LINE_STYLE} />,
    ],
    [id],
  );

  return (
    <ShapeSource id={id} shape={shape}>
      {layers}
    </ShapeSource>
  );
};
