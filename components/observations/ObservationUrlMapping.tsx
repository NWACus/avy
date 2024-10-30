import {AvalancheCenterID, AvalancheCenterWebsites} from 'types/nationalAvalancheCenter';

export const GenerateObservationShareLink = (centerId: AvalancheCenterID, observationId: string) => {
  let url: string = AvalancheCenterWebsites[centerId];

  if (centerId == 'CBAC') {
    // special link for obs sharing https://cbavalanchecenter.org/view-observations/#/view/observations/ddc9783a-a321-45cd-b656-88b066e5868d
    url += 'view-observations/#/view/observations/' + observationId;
  } else if (centerId == 'FAC') {
    // uber special https://www.flatheadavalanche.org/observations/view-observations/#/view/observations/3014f31b-ab2e-40f0-8d2e-6b5576fb2830
    url += 'observations/view-observations/#/view/observations/' + observationId;
  } else if (centerId == 'MSAC') {
    // also super special, will need to adjust https://www.shastaavalanche.org/node/7867/#/view/observations/71d356ff-b194-490f-82cb-3a7351fb0eb6
    url += 'node/7867/#/view/observations/' + observationId;
  } else if (centerId == 'WAC') {
    // special https://wallowaavalanchecenter.org/observations-list/#/view/observations/8e233605-1da8-47b9-9c29-2f7d7a1ca36e
    url += 'observations-list/#/view/observations/' + observationId;
  } else {
    url += 'observations/#/view/observations/' + observationId;
  }

  return url;
};
