import * as Sentry from '@sentry/react-native';
import difference from '@turf/difference';
import union from '@turf/union';
import {Logger} from 'browser-bunyan';
import {Feature, MultiPolygon, Polygon} from 'geojson';
import {MapLayerFeature} from 'types/nationalAvalancheCenter';

const isPolygonFeature = (feature: MapLayerFeature): feature is MapLayerFeature & {geometry: Polygon | MultiPolygon} =>
  feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon';

// Subtract the geometry of `mask` features from each feature in `featuresToCarve`. Features that end
// up fully covered by the mask are dropped. Non-polygon features in `featuresToCarve` are returned
// unchanged.
export const carvePolygonFeatures = (featuresToCarve: MapLayerFeature[], mask: MapLayerFeature[], logger: Logger): MapLayerFeature[] => {
  const maskPolygons = mask.filter(isPolygonFeature);
  if (maskPolygons.length === 0) {
    return featuresToCarve;
  }

  // @turf/union requires at least 2 features; with a single mask polygon use it directly as the footprint.
  let maskFootprint: Feature<Polygon | MultiPolygon>;
  if (maskPolygons.length === 1) {
    maskFootprint = {type: 'Feature', geometry: maskPolygons[0].geometry, properties: {}};
  } else {
    let unioned: Feature<Polygon | MultiPolygon> | null;
    try {
      unioned = union({
        type: 'FeatureCollection',
        features: maskPolygons.map(f => ({type: 'Feature' as const, geometry: f.geometry, properties: {}})),
      });
    } catch (err) {
      logger.warn({error: err}, 'failed to union mask polygons; skipping carve');
      Sentry.captureException(err, {tags: {turf_union: true}});
      return featuresToCarve;
    }
    if (!unioned) {
      return featuresToCarve;
    }
    maskFootprint = unioned;
  }

  return featuresToCarve.flatMap(feature => {
    if (!isPolygonFeature(feature)) {
      return [feature];
    }
    try {
      const carved = difference({
        type: 'FeatureCollection',
        features: [{type: 'Feature' as const, geometry: feature.geometry, properties: {}}, maskFootprint],
      });
      if (!carved) {
        return [];
      }
      return [{...feature, geometry: carved.geometry}];
    } catch (err) {
      logger.warn({error: err, feature_id: feature.id}, 'failed to carve mask from feature');
      Sentry.captureException(err, {tags: {turf_difference: true}});
      return [feature];
    }
  });
};
