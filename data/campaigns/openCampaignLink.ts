import * as Linking from 'expo-linking';

import {CampaignId} from 'data/campaigns/campaigns';
import {logger} from 'logger';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

// TODO: move this into the campaigns struct, add tests. I just have to go Xmas shopping right now.
export function openCampaignLink(avalancheCenterId: AvalancheCenterID, campaign: CampaignId) {
  if (campaign === 'nwac-campaign-q4-2023') {
    const urls = {
      NWAC: 'https://give.nwac.us/campaign/nwacs-year-end-fundraiser/c536433',
      SNFAC: 'https://friends.sawtoothavalanche.com/memberships/',
    } as Record<AvalancheCenterID, string | undefined>;
    const url = urls[avalancheCenterId];
    if (url) {
      Linking.openURL(url).catch((error: Error) => logger.error('Error opening URL', {error, url}));
    }
  }
}
