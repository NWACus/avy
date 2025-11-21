import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

// HPAC has a partnership to show weather data for CNFAIC. Because of this we need to use the CNFAIC center id to
// fetch certain information like the avalanche center metadata for the widget token and to fetch the weather station information
export const centerOrPartnerCenter = (center_id: AvalancheCenterID): AvalancheCenterID => {
  return center_id === 'HPAC' ? 'CNFAIC' : center_id;
};
