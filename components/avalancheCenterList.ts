import {AvalancheCenter, AvalancheCenterID, avalancheCenterIDSchema} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterListData {
  center: AvalancheCenter;
}

const supportedAvalancheCenters: AvalancheCenterID[] = ['NWAC', 'SNFAC'];

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
    whichCenters = metadata.filter(center => supportedAvalancheCenters.includes(center.id as AvalancheCenterID));
  } else {
    whichCenters = metadata;
  }

  return whichCenters.map(center => ({
    center: center,
  }));
};
