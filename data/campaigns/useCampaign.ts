import {campaignManager} from 'data/campaigns/campaignManager';
import {CampaignId} from 'data/campaigns/campaigns';
import {logger} from 'logger';
import mixpanel from 'mixpanel';
import {useFeatureFlag} from 'posthog-react-native';
import {useCallback, useEffect, useRef, useState} from 'react';

const useCampaign = (campaignId: CampaignId, location: string, date: Date | undefined = undefined): [campaignEnabled: boolean, trackInteraction: () => void] => {
  const campaignFeatureFlag = !!useFeatureFlag(campaignId);
  const [shouldShowCampaign] = useState(campaignManager.shouldShowCampaign(campaignId, location, date ?? new Date()));
  const campaignEnabled = shouldShowCampaign && campaignFeatureFlag;

  const showEventSent = useRef(false);
  useEffect(() => {
    if (!showEventSent.current && campaignEnabled) {
      showEventSent.current = true;
      campaignManager.recordCampaignView(campaignId, location).catch((error: Error) => {
        logger.error('Failed to record campaign view', {campaignId, location, error});
      });
      mixpanel.track('Campaign viewed', {campaignId, location});
    }
  }, [campaignEnabled, campaignId, location, showEventSent]);

  const interactionEventSent = useRef(false);
  const trackInteraction = useCallback(() => {
    if (!interactionEventSent.current && campaignEnabled) {
      interactionEventSent.current = true;
      mixpanel.track('Campaign interaction', {campaignId, location});
    }
  }, [campaignEnabled, campaignId, interactionEventSent, location]);

  return [campaignEnabled, trackInteraction];
};

export default useCampaign;
