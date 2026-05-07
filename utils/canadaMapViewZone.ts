import {Logger} from 'browser-bunyan';
import {AvalancheCenterID, CanadaForecastAreaFeature, CanadaForecastAreas, CanadaForecastMetadata, DangerLevel} from 'types/nationalAvalancheCenter';
import {CarvableFeature, carvePolygonFeatures} from 'utils/carvePolygonFeatures';

export type CanadaMapViewZone = {
  zone_id: string;
  url: string;
  danger_level: DangerLevel;
  feature: CanadaForecastAreaFeature;
};

const CANADA_DANGER_LEVELS: Record<string, DangerLevel> = {
  low: DangerLevel.Low,
  moderate: DangerLevel.Moderate,
  considerable: DangerLevel.Considerable,
  high: DangerLevel.High,
  extreme: DangerLevel.Extreme,
  norating: DangerLevel.GeneralInformation,
  offseason: DangerLevel.GeneralInformation,
  spring: DangerLevel.GeneralInformation,
};

export const canadaDangerLevelFor = (value: string, areaName: string, logger?: Logger): DangerLevel => {
  const dangerLevel = CANADA_DANGER_LEVELS[value.toLowerCase()];
  if (dangerLevel === undefined) {
    logger?.warn({value: value, area: areaName}, 'unrecognized avalanche canada danger rating');
    return DangerLevel.GeneralInformation;
  }
  return dangerLevel;
};

// HAC goes across the border and overlaps with a zone in Canada. If that changes, we can modify which NAC centers we need to carve out of Canada
export const CENTERS_OVERLAPPED_BY_AVALANCHE_CANADA: AvalancheCenterID[] = ['HAC'];

// Carve the overlapped NAC zones out of the Avalanche Canada areas so that we prioritize them
export const canadaMapViewZonesFor = (
  areas: CanadaForecastAreas | undefined,
  metadata: CanadaForecastMetadata | undefined,
  overlappingZones: CarvableFeature[],
  logger: Logger,
): CanadaMapViewZone[] => {
  if (!areas || !metadata) {
    return [];
  }
  const metadataById = new Map(metadata.map(item => [item.area.id, item]));
  const carvedFeatures = carvePolygonFeatures(areas.features, overlappingZones, logger);
  return carvedFeatures.flatMap(feature => {
    const item = metadataById.get(feature.id);
    if (!item) {
      return [];
    }
    return [
      {
        zone_id: feature.id,
        url: item.url,
        danger_level: canadaDangerLevelFor(item.highestDanger.value, item.area.name, logger),
        feature: feature,
      },
    ];
  });
};
