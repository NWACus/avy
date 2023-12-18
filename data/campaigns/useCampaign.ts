import {useFocusEffect} from '@react-navigation/native';
import {ICampaignManager, campaignManager} from 'data/campaigns/campaignManager';
import {CampaignId, CampaignLocationId} from 'data/campaigns/campaigns';
import {logger as globalLogger} from 'logger';
import mixpanel from 'mixpanel';
import {useFeatureFlag} from 'posthog-react-native';
import {useCallback, useRef, useState} from 'react';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

const logger = globalLogger.child({component: 'useCampaign'});

export function useCampaign<T extends CampaignId>(
  centerId: AvalancheCenterID,
  campaignId: T,
  location: CampaignLocationId<T>,
  theCampaignManager: ICampaignManager = campaignManager,
  date: Date | undefined = undefined,
): [campaignEnabled: boolean, trackInteraction: () => void] {
  const campaignFeatureFlag = !!useFeatureFlag(campaignId);
  const [campaignEnabled, setCampaignEnabled] = useState(false);
  logger.debug('useCampaign', {centerId, campaignId, location, campaignFeatureFlag, campaignEnabled});

  // When our parent screen is focused, check the status of the campaign. Keep the status constant until the screen is unfocused.
  useFocusEffect(
    useCallback(() => {
      const shouldShowCampaign = theCampaignManager.shouldShowCampaign(centerId, campaignId, location, date);
      setCampaignEnabled(shouldShowCampaign && campaignFeatureFlag);
      if (shouldShowCampaign && campaignFeatureFlag) {
        theCampaignManager.recordCampaignView(campaignId, location).catch((error: Error) => {
          logger.error('Failed to record campaign view', {campaignId, location, error});
        });
        mixpanel.track('Campaign viewed', {center: centerId, campaign: campaignId, 'campaign-location': location});
        logger.debug('Sent campaign view event', {campaignId, location});
      }
      return () => {
        setCampaignEnabled(false);
      };
    }, [campaignFeatureFlag, campaignId, centerId, date, location, theCampaignManager]),
  );

  logger.debug('Campaign enabled', {campaignId, location, campaignFeatureFlag, campaignEnabled});

  const interactionEventSent = useRef(false);
  const trackInteraction = useCallback(() => {
    if (!interactionEventSent.current && campaignEnabled) {
      interactionEventSent.current = true;
      mixpanel.track('Campaign interaction', {center: centerId, campaign: campaignId, 'campaign-location': location});
      logger.debug('Sent campaign interaction event', {campaignId, location});
    }
  }, [campaignEnabled, campaignId, centerId, location]);

  return [campaignEnabled, trackInteraction];
}
