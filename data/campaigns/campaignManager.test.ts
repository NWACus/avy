import AsyncStorage from '@react-native-async-storage/async-storage';
import {CAMPAIGN_DATA_KEY} from 'data/asyncStorageKeys';
import {CampaignViewsSchema, ICampaignManager, createCampaignManagerForTests} from 'data/campaigns/campaignManager';

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
            lastDisplayed: '2023-12-15T00:00:00.000Z',
            timesDisplayed: 1,
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
            lastDisplayed: '2023-12-15T00:00:00.000Z',
            timesDisplayed: 1,
          },
        }),
      );
      campaignManager = await createCampaignManagerForTests();
      expect(campaignManager).toBeDefined();

      // Record a campaign view, which then causes the campaign to be saved
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');
      await campaignManager.recordCampaignView(campaignId, today);

      const campaignViews = JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) || '{}') as CampaignViewsSchema;
      expect(campaignViews).toEqual({
        'test-enabled-campaign': {
          lastDisplayed: today.toISOString(),
          timesDisplayed: 1,
        },
      });
    });

    it('should keep current campaigns when loading', async () => {
      await AsyncStorage.setItem(
        CAMPAIGN_DATA_KEY,
        JSON.stringify({
          'test-enabled-campaign': {
            lastDisplayed: '2023-12-15T00:00:00.000Z',
            timesDisplayed: 2,
          },
        }),
      );
      campaignManager = await createCampaignManagerForTests();
      expect(campaignManager).toBeDefined();

      // Record a campaign view, which then causes the campaign to be saved
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');
      await campaignManager.recordCampaignView(campaignId, today);

      const campaignViews = JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) || '{}') as CampaignViewsSchema;
      expect(campaignViews).toEqual({
        'test-enabled-campaign': {
          lastDisplayed: today.toISOString(),
          timesDisplayed: 3,
        },
      });
    });
  });

  describe('shouldShowCampaign', () => {
    it('should return true if the campaign is enabled and within the date range', () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2023-12-15');
      expect(campaignManager.shouldShowCampaign(campaignId, currentDate)).toBe(true);
    });

    it('should return false if the campaign is disabled', () => {
      const campaignId = 'test-disabled-campaign';
      const currentDate = new Date('2023-12-15');
      expect(campaignManager.shouldShowCampaign(campaignId, currentDate)).toBe(false);
    });

    it('should return false if the campaign has ended', () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2024-01-15');
      expect(campaignManager.shouldShowCampaign(campaignId, currentDate)).toBe(false);
    });

    it('should return false if the campaign has not started', () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2022-12-15');
      expect(campaignManager.shouldShowCampaign(campaignId, currentDate)).toBe(false);
    });

    it('should respect the viewsPerDay field', async () => {
      const campaignId = 'test-enabled-campaign';
      const today = new Date('2023-12-15');
      const tomorrow = new Date('2023-12-16');

      // Should show the campaign 3 times today
      expect(campaignManager.shouldShowCampaign(campaignId, today)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, today);
      expect(campaignManager.shouldShowCampaign(campaignId, today)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, today);
      expect(campaignManager.shouldShowCampaign(campaignId, today)).toBe(true);
      await campaignManager.recordCampaignView(campaignId, today);
      expect(campaignManager.shouldShowCampaign(campaignId, today)).toBe(false);

      expect(campaignManager.shouldShowCampaign(campaignId, tomorrow)).toBe(true);
    });
  });

  describe('recordCampaignView', () => {
    it('should record a campaign view', async () => {
      const campaignId = 'test-enabled-campaign';
      const currentDate = new Date('2023-12-15');
      await campaignManager.recordCampaignView(campaignId, currentDate);

      const campaignViews = JSON.parse((await AsyncStorage.getItem(CAMPAIGN_DATA_KEY)) || '{}') as CampaignViewsSchema;
      expect(campaignViews).toEqual({
        'test-enabled-campaign': {
          lastDisplayed: currentDate.toISOString(),
          timesDisplayed: 1,
        },
      });
    });
  });
});
