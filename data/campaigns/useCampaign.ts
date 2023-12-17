import {ICampaignManager, campaignManager} from 'data/campaigns/campaignManager';
import {CampaignId, CampaignLocationId} from 'data/campaigns/campaigns';
import {logger} from 'logger';
import mixpanel from 'mixpanel';
import {useFeatureFlag} from 'posthog-react-native';
import {useCallback, useEffect, useRef, useState} from 'react';

export function useCampaign<T extends CampaignId>(
  campaignId: T,
  location: CampaignLocationId<T>,
  theCampaignManager: ICampaignManager = campaignManager,
  date: Date | undefined = undefined,
): [campaignEnabled: boolean, trackInteraction: () => void] {
  const campaignFeatureFlag = !!useFeatureFlag(campaignId);
  const [shouldShowCampaign] = useState(theCampaignManager.shouldShowCampaign(campaignId, location, date ?? new Date()));
  const campaignEnabled = shouldShowCampaign && campaignFeatureFlag;

  const showEventSent = useRef(false);
  useEffect(() => {
    if (!showEventSent.current && campaignEnabled) {
      showEventSent.current = true;
      theCampaignManager.recordCampaignView(campaignId, location).catch((error: Error) => {
        logger.error('Failed to record campaign view', {campaignId, location, error});
      });
      mixpanel.track('Campaign viewed', {campaign: campaignId, 'campaign-location': location});
    }
  }, [campaignEnabled, campaignId, location, showEventSent, theCampaignManager]);

  const interactionEventSent = useRef(false);
  const trackInteraction = useCallback(() => {
    if (!interactionEventSent.current && campaignEnabled) {
      interactionEventSent.current = true;
      mixpanel.track('Campaign interaction', {campaign: campaignId, 'campaign-location': location});
    }
  }, [campaignEnabled, campaignId, interactionEventSent, location]);

  return [campaignEnabled, trackInteraction];
}
