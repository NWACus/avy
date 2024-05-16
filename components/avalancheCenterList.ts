import * as Updates from 'expo-updates';
import {AvalancheCenter, AvalancheCenterID, avalancheCenterIDSchema} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterListData {
  center: AvalancheCenter;
  description?: string;
}

const supportedAvalancheCenters = (): {center: AvalancheCenterID; description: string}[] => {
  const centers: {center: AvalancheCenterID; description: string}[] = [
    {center: 'NWAC', description: 'Avalanche forecasts for Washington and Northern Oregon.'},
    {center: 'SNFAC', description: 'Avalanche forecasts for South Central Idaho.'},
  ];

  if (Updates.channel !== 'release') {
    centers.push(
      {center: 'BTAC', description: 'Avalanche forecasts for Western Wyoming and Eastern Idaho.'},
      {center: 'SAC', description: 'Avalanche forecasts for the Lake Tahoe region in California.'},
      {center: 'MSAC', description: 'Avalanche forecasts for the Mount Shasta region in California.'},
      {center: 'CBAC', description: 'Avalanche forecasts for Southwestern Colorado.'},
      {center: 'FAC', description: 'Avalanche forecasts for Northwestern Montana.'},
      {center: 'MWAC', description: 'Avalanche forecasts for Mount Washington.'},
    );
  }

  return centers;
};

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

export const filterToSupportedCenters = (ids: AvalancheCenterID[]): AvalancheCenterID[] => {
  const supportedCenters: AvalancheCenterID[] = supportedAvalancheCenters().map(c => c.center);
  return ids.filter(id => supportedCenters.includes(id));
};

export const avalancheCenterList = (metadata: AvalancheCenter[]): AvalancheCenterListData[] => {
  const centers = supportedAvalancheCenters();
  return metadata
    .map(center => ({
      center: center,
      description: centers.find(supported => supported.center === center.id)?.description,
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
        return centers.findIndex(supported => supported.center === a.center.id) - centers.findIndex(supported => supported.center === b.center.id);
      }
    });
};
