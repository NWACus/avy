// Campaign tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import {CAMPAIGN_DATA_KEY} from 'data/asyncStorageKeys';
import CAMPAIGNS, {CampaignId, UNLIMITED_VIEWS_PER_DAY} from 'data/campaigns/campaigns';
import {differenceInCalendarDays} from 'date-fns';
import {logger} from 'logger';
import * as Sentry from 'sentry-expo';
import {z} from 'zod';

const campaignViewSchema = z.record(
  z.object({
    lastDisplayed: z.coerce.date().optional(),
    timesDisplayed: z.number(),
  }),
);

type CampaignViewSchema = z.infer<typeof campaignViewSchema>;

const campaignViewsSchema = z.record(campaignViewSchema);
export type CampaignViewsSchema = z.infer<typeof campaignViewsSchema>;

export interface ICampaignManager {
  /** Given a date, calls campaignActive to see if the given campaign is active for that date,
   * and then checks `lastDisplayed` date and `viewsPerDay` to decide if the campaign should be shown.
   */
  shouldShowCampaign(campaignId: CampaignId, location: string, atDate?: Date): boolean;

  /** Records a campaign view for the given campaignId. Use along with shouldShowCampaign to track
   * views of more intrusive campaign elements.
   * @see shouldShowCampaign */
  recordCampaignView(campaignId: CampaignId, location: string, atDate?: Date): Promise<void>;
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
            this.campaignViews[campaignId] = campaignView;
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

  shouldShowCampaign(campaignId: CampaignId, location: string, atDate: Date | undefined = undefined): boolean {
    this.checkInitialized();
    const campaign = CAMPAIGNS[campaignId];
    const date = atDate ?? new Date();
    const campaignActive = campaign.enabled && date >= campaign.startDate && date < campaign.endDate;
    if (!campaignActive) {
      return false;
    }
    const campaignView = this.campaignViews[campaignId]?.[location];
    if (!campaignView || !campaignView.lastDisplayed) {
      return true;
    }
    const viewsPerDay = campaign.locations[location].viewsPerDay ?? UNLIMITED_VIEWS_PER_DAY;
    const moreViewsAllowed = viewsPerDay === UNLIMITED_VIEWS_PER_DAY || campaignView.timesDisplayed < viewsPerDay;

    return differenceInCalendarDays(date, campaignView.lastDisplayed) >= 1 || moreViewsAllowed;
  }

  async recordCampaignView(campaignId: CampaignId, location: string, atDate: Date | undefined = undefined) {
    this.checkInitialized();

    const date = atDate ?? new Date();
    if (!this.campaignViews[campaignId]) {
      this.campaignViews[campaignId] = {};
    }
    const campaignView = this.campaignViews[campaignId]?.[location];
    if (!campaignView) {
      this.campaignViews[campaignId][location] = {
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
