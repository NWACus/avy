import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

const allAvalancheCenterIDs: AvalancheCenterID[] = [
  'BAC', // Bridgeport: CA
  'BTAC', // Bridger-Teton: ID, WY
  'FAC', // Flathead: MT
  'IPAC', // Idaho Panhandle: ID, MT
  'KPAC', // Kachina: AZ
  'NWAC', // Northwest: WA, OR
  'MSAC', // Mount Shasta: CA
  'MWAC', // Mount Washington: NH
  'PAC', // Payette: ID
  'SNFAC', // Sawtooths: ID
  'SAC', // Sierra: CA
  'TAC', // Taos: NM
  'WCMAC', // West Central Montana: MT
  'COAA', // Central Oregon: OR
  'CBAC', // Crested Butte: CO
  'ESAC', // Eastern Sierra: CA
  'WAC', // Wallowas: OR
];

export interface AvalancheCenterListData {
  center: AvalancheCenterID;
  title: string;
  subtitle?: string;
}

const supportedAvalancheCenters: AvalancheCenterListData[] = [
  {
    center: 'NWAC',
    title: 'Northwest Avalanche Center',
    subtitle: 'The Northwest Avalanche Center (NWAC) produces daily avalanche forecasts for 10 zones across Washington State and northern Oregon.',
  },
  {
    center: 'SNFAC',
    title: 'Sawtooth Avalanche Center',
    subtitle: 'The Sawtooth Avalanche Center provides avalanche information and education for South Central Idaho.',
  },
];

export enum AvalancheCenters {
  SupportedCenters,
  AllCenters,
}

export const useAvalancheCenters = (centers: AvalancheCenters) => {
  if (centers === AvalancheCenters.SupportedCenters) {
    return supportedAvalancheCenters;
  }

  // TODO - there's an API that would allow us to get this list dynamically
  // TODO - would be nice to turn the center IDs into their names, but this is only for debugging so I'm punting for now
  return allAvalancheCenterIDs.map(center => ({
    center,
    title: center,
  }));
};
