import AsyncStorage from '@react-native-async-storage/async-storage';

import {CAMPAIGN_DATA_KEY} from 'data/asyncStorageKeys';
import {AllCampaignsViewData, ICampaignManager, createCampaignManagerForTests} from 'data/campaigns/campaignManager';
import CAMPAIGNS, {UNLIMITED_VIEWS_PER_DAY} from 'data/campaigns/campaigns';

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
              timesDisplayed: 1,
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
              timesDisplayed: 1,
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
            timesDisplayed: 1,
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
              timesDisplayed: 2,
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
            timesDisplayed: 3,
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

    it('should respect the viewsPerDay field', async () => {
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');
      const tomorrow = new Date('2023-12-16');

      // Should show the campaign 3 times today
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', today)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, 'home-screen', today);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', today)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, 'home-screen', today);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', today)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, 'home-screen', today);
      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', today)).toBe(false);

      expect(campaignManager.shouldShowCampaign(campaignId, 'home-screen', tomorrow)).toBe(true);
    });

    it('allows unlimited views per day when viewsPerDay === UNLIMITED_VIEWS_PER_DAY', async () => {
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');

      expect(CAMPAIGNS[campaignId].locations['always-show'].viewsPerDay).toBe(UNLIMITED_VIEWS_PER_DAY);
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
            timesDisplayed: 1,
          },
        },
      });
    });
  });
});
