import AsyncStorage from '@react-native-async-storage/async-storage';

import {CAMPAIGN_DATA_KEY} from 'data/asyncStorageKeys';
import {AllCampaignsViewData, ICampaignManager, createCampaignManagerForTests} from 'data/campaigns/campaignManager';
import CAMPAIGNS, {ALWAYS_SHOW} from 'data/campaigns/campaigns';
import {addHours} from 'date-fns';

describe('campaignManager', () => {
  let campaignManager: ICampaignManager;

  beforeEach(async () => {
    await AsyncStorage.removeItem(CAMPAIGN_DATA_KEY);
    campaignManager = await createCampaignManagerForTests();
  });

  describe('initialize', () => {
    it('should ignore malformed data at startup', async () => {
      await AsyncStorage.setItem(CAMPAIGN_DATA_KEY, JSON.stringify(['not valid data']));
      campaignManager = await createCampaignManagerForTests();
      expect(campaignManager).toBeDefined();
    });

    it('should be able to load data from old campaigns without crashing', async () => {
      await AsyncStorage.setItem(
        CAMPAIGN_DATA_KEY,
        JSON.stringify({
          'old-unused-campaign': {
            'home-screen': {
              lastDisplayed: '2023-12-15T00:00:00.000Z',
            },
          },
        }),
      );
      campaignManager = await createCampaignManagerForTests();
      expect(campaignManager).toBeDefined();
    });

    it('should not save old campaigns when persisting', async () => {
      await AsyncStorage.setItem(
        CAMPAIGN_DATA_KEY,
        JSON.stringify({
          'old-unused-campaign': {
            'home-screen': {
              lastDisplayed: '2023-12-15T00:00:00.000Z',
            },
          },
        }),
      );
      campaignManager = await createCampaignManagerForTests();
      expect(campaignManager).toBeDefined();

      // Record a campaign view, which then causes the campaign to be saved
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');
      await campaignManager.recordCampaignView(campaignId, 'home-screen', today);

      const campaignViews = JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) || '{}') as AllCampaignsViewData;
      expect(campaignViews).toEqual({
        'test-enabled-campaign': {
          'home-screen': {
            lastDisplayed: today.toISOString(),
          },
        },
      });
    });

    it('should keep current campaigns when loading', async () => {
      await AsyncStorage.setItem(
        CAMPAIGN_DATA_KEY,
        JSON.stringify({
          'test-enabled-campaign': {
            'home-screen': {
              lastDisplayed: '2023-12-15T00:00:00.000Z',
            },
          },
        }),
      );
      campaignManager = await createCampaignManagerForTests();
      expect(campaignManager).toBeDefined();

      // Record a campaign view, which then causes the campaign to be saved
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');
      await campaignManager.recordCampaignView(campaignId, 'home-screen', today);

      const campaignViews = JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) || '{}') as AllCampaignsViewData;
      expect(campaignViews).toEqual({
        'test-enabled-campaign': {
          'home-screen': {
            lastDisplayed: today.toISOString(),
          },
        },
      });
    });
  });

  describe('shouldShowCampaign', () => {
    it('should return true if the campaign is enabled and within the date range', () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2023-12-15');
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', currentDate)).toBe(true);
    });

    it('should return false if the campaign is disabled', () => {
      const campaignId = 'test-disabled-campaign';
      const currentDate = new Date('2023-12-15');
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', currentDate)).toBe(false);
    });

    it('should return false if the campaign has ended', () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2024-01-15');
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', currentDate)).toBe(false);
    });

    it('should return false if the campaign has not started', () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2022-12-15');
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', currentDate)).toBe(false);
    });

    it('should respect the frequency field', async () => {
      const campaignId = 'test-enabled-campaign';
      let date = new Date('2023-12-15');

      // Should show the campaign no more than every 2 hours; should only show once at that time
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', date)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, 'home-screen', date);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', date)).toBe(false);

      // If only one hour has elapsed, we're still not ready to show again
      date = addHours(date, 1);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', date)).toBe(false);

      // If one more hour has elapsed, we are ready to show
      date = addHours(date, 1);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', date)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, 'home-screen', date);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', date)).toBe(false);

      // Add more hours and we can show again
      date = addHours(date, 8);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', date)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, 'home-screen', date);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', date)).toBe(false);
    });

    it('allows unlimited views per day when frequency === ALWAYS_SHOW', async () => {
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');

      expect(CAMPAIGNS[campaignId].locations['always-show'].frequency).toBe(ALWAYS_SHOW);
      for (let i = 0; i < 10; i++) {
        expect(campaignManager.shouldShowCampaign(campaignId, 'always-show', today)).toBe(true);
        await campaignManager.recordCampaignView(campaignId, 'always-show', today);
      }
    });
  });

  describe('recordCampaignView', () => {
    it('should record a campaign view', async () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2023-12-15');
      await campaignManager.recordCampaignView(campaignId, 'home-screen', currentDate);

      const campaignViews = JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) || '{}') as AllCampaignsViewData;
      expect(campaignViews).toEqual({
        'test-enabled-campaign': {
          'home-screen': {
            lastDisplayed: currentDate.toISOString(),
          },
        },
      });
    });
  });
});
