// Campaign tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import {CAMPAIGN_DATA_KEY} from 'data/asyncStorageKeys';
import CAMPAIGNS, {CampaignId} from 'data/campaigns/campaigns';
import {differenceInCalendarDays} from 'date-fns';
import {logger} from 'logger';
import * as Sentry from 'sentry-expo';
import {z} from 'zod';

const campaignViewSchema = z.object({
  lastDisplayed: z.coerce.date().optional(),
  timesDisplayed: z.number(),
});

type CampaignViewSchema = z.infer<typeof campaignViewSchema>;

const campaignViewsSchema = z.record(campaignViewSchema);
export type CampaignViewsSchema = z.infer<typeof campaignViewsSchema>;

export interface ICampaignManager {
  shouldShowCampaign(campaignId: CampaignId, atDate?: Date): boolean;
  recordCampaignView(campaignId: CampaignId, atDate?: Date): Promise<void>;
}

class CampaignManager implements ICampaignManager {
  private initialized = false;
  private campaignViews: Record<CampaignId, CampaignViewSchema> = {} as Record<CampaignId, CampaignViewSchema>;
  private logger = logger.child({component: 'CampaignManager'});

  async initialize() {
    if (!this.initialized) {
      try {
        const campaignViews = campaignViewsSchema.parse(JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) ?? '{}'));
        // Filter out data from campaigns that don't exist anymore
        Object.entries(campaignViews).forEach(([campaignId, campaignView]) => {
          if (campaignId in CAMPAIGNS) {
            this.campaignViews[campaignId as CampaignId] = campaignView;
          }
        });
      } catch (e) {
        // Error parsing campaignViews, ignore as we'll fall back to defaults
        await AsyncStorage.removeItem(CAMPAIGN_DATA_KEY);
        // But do log it to Sentry as it shouldn't happen
        Sentry.Native.captureException(e);
      }
      this.initialized = true;
    }
    return this.campaignViews;
  }

  private checkInitialized() {
    if (!this.initialized) {
      this.logger.error('ObservationUploader not initialized');
      throw new Error('ObservationUploader not initialized');
    }
  }

  async saveCampaignViews() {
    // todo: debounce
    await AsyncStorage.setItem(CAMPAIGN_DATA_KEY, JSON.stringify(this.campaignViews));
  }

  shouldShowCampaign(campaignId: CampaignId, atDate: Date | undefined = undefined): boolean {
    this.checkInitialized();
    const campaign = CAMPAIGNS[campaignId];
    const date = atDate ?? new Date();
    const campaignActive = campaign.enabled && date >= campaign.startDate && date < campaign.endDate;
    if (!campaignActive) {
      return false;
    }
    const campaignView = this.campaignViews[campaignId];
    if (!campaignView || !campaignView.lastDisplayed) {
      return true;
    }

    return differenceInCalendarDays(date, campaignView.lastDisplayed) >= 1 || campaignView.timesDisplayed < campaign.viewsPerDay;
  }

  async recordCampaignView(campaignId: CampaignId, atDate: Date | undefined = undefined) {
    this.checkInitialized();

    const date = atDate ?? new Date();
    const campaignView = this.campaignViews[campaignId];
    if (!campaignView) {
      this.campaignViews[campaignId] = {
        lastDisplayed: date,
        timesDisplayed: 1,
      };
    } else {
      const lastDisplayed = campaignView.lastDisplayed;
      campaignView.lastDisplayed = date;
      if (lastDisplayed && differenceInCalendarDays(date, lastDisplayed) >= 1) {
        campaignView.timesDisplayed = 0;
      }
      campaignView.timesDisplayed += 1;
    }
    await this.saveCampaignViews();
  }
}

const theManager: CampaignManager = new CampaignManager();
void theManager.initialize();
export const campaignManager: ICampaignManager = theManager;

export const createCampaignManagerForTests = async (): Promise<ICampaignManager> => {
  const campaignManager = new CampaignManager();
  await campaignManager.initialize();
  return campaignManager;
};
