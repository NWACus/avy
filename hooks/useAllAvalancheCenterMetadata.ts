import {filterToNACCenters} from 'components/avalancheCenterList';
import {useAvalancheCentersMetadata} from 'hooks/useAvalancheCentersMetadata';
import {AllAvalancheCenterCapabilities, AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const useAllAvalancheCenterMetadata = (capabilities: AllAvalancheCenterCapabilities | undefined) => {
  const knownCenters: AvalancheCenterID[] = [];
  if (capabilities) {
    knownCenters.push(...filterToNACCenters(capabilities.centers.map(center => center.id)));
  }

  return useAvalancheCentersMetadata(knownCenters);
};
