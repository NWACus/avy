import {interiorPoint, pointInFeature} from 'components/helpers/geographicCoordinates';
import {MapLayerFeature, ObservationZonesFeature} from 'types/nationalAvalancheCenter';

export const observationOnlyZones = (alternateZones: ObservationZonesFeature[] | undefined, mapFeatures: MapLayerFeature[]): ObservationZonesFeature[] | undefined => {
  if (!alternateZones) {
    return alternateZones;
  }
  const forecastZoneNames = new Set(mapFeatures.map(feature => feature.properties.name));

  // Check if the zone name is exactly contained, and double check the geometry if not.
  // Zone names are not 100% reliable as they can be misspelled in the data returned from useAlternateObservationZones
  return alternateZones.filter(zone => {
    if (forecastZoneNames.has(zone.properties.name)) {
      return false;
    }
    const point = interiorPoint(zone.geometry);
    if (!point) {
      return true;
    }
    return !mapFeatures.some(feature => pointInFeature(point, feature));
  });
};
