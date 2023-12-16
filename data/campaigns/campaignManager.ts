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
  /** Given a date, checks if the given campaign is active for that date. Does not reflect
   * view counts or lastDisplayed values. Use for less intrusive elements. */
  campaignActive(campaignId: CampaignId, atDate?: Date): boolean;

  /** Given a date, calls campaignActive to see if the given campaign is active for that date,
   * and then checks `lastDisplayed` date and `viewsPerDay` to decide if the campaign should be shown.
   * Used for more intrusive campaigns elements such as modals. */
  shouldShowCampaign(campaignId: CampaignId, atDate?: Date): boolean;

  /** Records a campaign view for the given campaignId. Use along with shouldShowCampaign to track
   * views of more intrusive campaign elements.
   * @see shouldShowCampaign */
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
      this.logger.error('CampaignManager not initialized');
      throw new Error('CampaignManager not initialized');
    }
  }

  private async saveCampaignViews() {
    this.checkInitialized();
    // todo: debounce
    await AsyncStorage.setItem(CAMPAIGN_DATA_KEY, JSON.stringify(this.campaignViews));
  }

  campaignActive(campaignId: CampaignId, atDate: Date | undefined = undefined): boolean {
    this.checkInitialized();
    const campaign = CAMPAIGNS[campaignId];
    const date = atDate ?? new Date();
    return campaign.enabled && date >= campaign.startDate && date < campaign.endDate;
  }

  shouldShowCampaign(campaignId: CampaignId, atDate: Date | undefined = undefined): boolean {
    this.checkInitialized();
    const campaign = CAMPAIGNS[campaignId];
    const date = atDate ?? new Date();
    const campaignActive = this.campaignActive(campaignId, date);
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
