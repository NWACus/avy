// Campaign tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import {CAMPAIGN_DATA_KEY} from 'data/asyncStorageKeys';
import CAMPAIGNS, {ALWAYS_SHOW, CampaignId, CampaignLocationId} from 'data/campaigns/campaigns';
import {logger} from 'logger';
import * as Sentry from 'sentry-expo';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {z} from 'zod';

const campaignLocationViewDataSchema = z.object({
  lastDisplayed: z.coerce.date().optional(),
});
type CampaignLocationViewData = z.infer<typeof campaignLocationViewDataSchema>;

const campaignViewDataSchema = z.record(campaignLocationViewDataSchema);
const allCampaignsViewData = z.record(campaignViewDataSchema);
export type AllCampaignsViewData = z.infer<typeof allCampaignsViewData>;

export interface ICampaignManager {
  /** Given a date, calls campaignActive to see if the given campaign is active for that date,
   * and then checks `lastDisplayed` date and `frequency` to decide if the campaign should be shown.
   */
  shouldShowCampaign<T extends CampaignId>(centerId: AvalancheCenterID, campaignId: T, location: CampaignLocationId<T>, atDate?: Date): boolean;

  /** Records a campaign view for the given campaignId. Use along with shouldShowCampaign to track
   * views of more intrusive campaign elements.
   * @see shouldShowCampaign */
  recordCampaignView<T extends CampaignId>(campaignId: T, location: CampaignLocationId<T>, atDate?: Date): Promise<void>;
}

class CampaignManager implements ICampaignManager {
  private initialized = false;
  private campaignViews: AllCampaignsViewData = {} as AllCampaignsViewData;
  private logger = logger.child({component: 'CampaignManager'});

  async initialize() {
    if (!this.initialized) {
      try {
        const campaignViews = allCampaignsViewData.parse(JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) ?? '{}'));
        // Only extract data from campaigns that are currently in use
        Object.entries(campaignViews).forEach(([campaignId, campaignView]) => {
          if (campaignId in CAMPAIGNS) {
            Object.entries(campaignView).forEach(([location, locationView]) => {
              if (location in CAMPAIGNS[campaignId as CampaignId].locations) {
                this.setCampaignViewData(campaignId as CampaignId, location as CampaignLocationId<CampaignId>, locationView);
              }
            });
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
  }

  private checkInitialized() {
    if (!this.initialized) {
      this.logger.error('CampaignManager not initialized');
      throw new Error('CampaignManager not initialized');
    }
  }

  private async saveCampaignViews() {
    await AsyncStorage.setItem(CAMPAIGN_DATA_KEY, JSON.stringify(this.campaignViews));
  }

  private getCampaignViewData<T extends CampaignId>(campaignId: T, location: CampaignLocationId<T>): CampaignLocationViewData {
    if (typeof location !== 'string') {
      // this should never happen. typescript simultaneously can tell you that only selected strings are allowed for `location`,
      // and yet also treats it as string | symbol | number when you try to index into an object with it. this check
      // makes the compiler behave as expected.
      throw new Error(`Invalid location type for ${location.toString()}`);
    }

    const data = this.campaignViews[campaignId]?.[location] || {lastDisplayed: undefined};

    // Return a copy of the data so that we don't accidentally mutate it
    return {...data};
  }

  private setCampaignViewData<T extends CampaignId>(campaignId: T, location: CampaignLocationId<T>, data: CampaignLocationViewData): void {
    if (typeof location !== 'string') {
      // this should never happen. typescript simultaneously can tell you that only selected strings are allowed for `location`,
      // and yet also treats it as string | symbol | number when you try to index into an object with it. this check
      // makes the compiler behave as expected.
      throw new Error(`Invalid location type for ${location.toString()}`);
    }

    this.campaignViews[campaignId] = this.campaignViews[campaignId] || {};
    this.campaignViews[campaignId][location] = data;
  }

  shouldShowCampaign<T extends CampaignId>(centerId: AvalancheCenterID, campaignId: T, location: CampaignLocationId<T>, atDate: Date | undefined = undefined): boolean {
    this.checkInitialized();
    this.logger.debug('shouldShowCampaign', {centerId, campaignId, location, atDate});
    const campaign = CAMPAIGNS[campaignId];
    const date = atDate ?? new Date();
    const campaignActive = campaign.enabled && date >= campaign.startDate && date < campaign.endDate;
    if (!campaignActive) {
      this.logger.debug('campaign not active');
      return false;
    }
    if ('allowedCenters' in campaign && !(campaign.allowedCenters as readonly string[]).includes(centerId)) {
      this.logger.debug('campaign not allowed for this center');
      return false;
    }
    const campaignView = this.getCampaignViewData(campaignId, location);
    if (!campaignView.lastDisplayed) {
      return true;
    }

    // Typescript gets really lost here trying to infer the type of campaign.locations[location]
    const {frequency} = (campaign.locations as Record<string, {frequency: number}>)[location as string] ?? {frequency: ALWAYS_SHOW};
    const deltaMs = date.getTime() - campaignView.lastDisplayed.getTime();
    this.logger.debug('shouldShowCampaign', {
      location,
      frequency,
      date: date.toISOString(),
      lastDisplayed: campaignView.lastDisplayed.toISOString(),
      deltaMs,
      show: deltaMs >= frequency,
    });
    return deltaMs >= frequency;
  }

  async recordCampaignView<T extends CampaignId>(campaignId: T, location: CampaignLocationId<T>, atDate: Date | undefined = undefined) {
    this.checkInitialized();

    const date = atDate ?? new Date();
    this.setCampaignViewData(campaignId, location, {lastDisplayed: date});
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

export const clearCampaignViewData = async (): Promise<void> => {
  await AsyncStorage.removeItem(CAMPAIGN_DATA_KEY);
};
