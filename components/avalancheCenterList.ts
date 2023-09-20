import {AvalancheCenter, AvalancheCenterID, avalancheCenterIDSchema} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterListData {
  center: AvalancheCenter;
  description?: string;
}

const supportedAvalancheCenters: {center: AvalancheCenterID; description: string}[] = [
  {center: 'NWAC', description: 'Avalanche forecasts for Washington and Northern Oregon.'},
  {center: 'SNFAC', description: 'Avalanche forecasts for South Central Idaho.'},
];

export enum AvalancheCenters {
  SupportedCenters,
  AllCenters,
}

// In order to display data for the center, we need to know about it so that we have a logo, etc.
export const filterToKnownCenters = (ids: string[]): AvalancheCenterID[] => {
  const knownCenters: AvalancheCenterID[] = [];
  for (const center of ids) {
    const idResult = avalancheCenterIDSchema.safeParse(center);
    if (idResult.success) {
      knownCenters.push(idResult.data);
    }
  }
  return knownCenters;
};

export const avalancheCenterList = (centers: AvalancheCenters, metadata: AvalancheCenter[]): AvalancheCenterListData[] => {
  let whichCenters: AvalancheCenter[] = [];
  if (centers === AvalancheCenters.SupportedCenters) {
    whichCenters = metadata.filter(center => supportedAvalancheCenters.some(supported => supported.center === center.id));
  } else {
    whichCenters = metadata;
  }

  return whichCenters
    .map(center => ({
      center: center,
      description: supportedAvalancheCenters.find(supported => supported.center === center.id)?.description,
    }))
    .sort((a, b) => {
      // Centers with descriptions are "blessed" and should sort above the rest
      if (a.description && !b.description) {
        return -1;
      } else if (!a.description && b.description) {
        return 1;
      } else if (!a.description && !b.description) {
        // Unsupported centers are sorted alphabetically
        return a.center.name.localeCompare(b.center.name);
      } else {
        // Supported centers are sorted according to their order in supportedAvalancheCenters
        return (
          supportedAvalancheCenters.findIndex(supported => supported.center === a.center.id) - supportedAvalancheCenters.findIndex(supported => supported.center === b.center.id)
        );
      }
    });
};
