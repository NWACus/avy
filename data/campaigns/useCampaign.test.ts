/* ESLint reads references to mixpanel.track as attempts to call it */
/* eslint-disable @typescript-eslint/unbound-method */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {act, renderHook} from '@testing-library/react-hooks';
import mixpanel from 'mixpanel';
import {useFeatureFlag} from 'posthog-react-native';

import {CAMPAIGN_DATA_KEY} from 'data/asyncStorageKeys';
import {ICampaignManager, createCampaignManagerForTests} from 'data/campaigns/campaignManager';
import {useCampaign} from 'data/campaigns/useCampaign';

jest.mock('mixpanel', () => ({
  track: jest.fn(),
}));

jest.mock('posthog-react-native', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn().mockImplementation((callback: () => void) => {
    setImmediate(callback);
  }),
}));

describe('useCampaign', () => {
  let campaignManager: ICampaignManager;

  beforeEach(async () => {
    await AsyncStorage.removeItem(CAMPAIGN_DATA_KEY);
    campaignManager = await createCampaignManagerForTests();

    (useFeatureFlag as jest.Mock).mockReturnValue(true);

    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should return true for an enabled campaign', () => {
    const campaignId = 'test-enabled-campaign';
    const location = 'home-screen';
    const currentDate = new Date('2023-12-15');

    const {result} = renderHook(() => useCampaign(campaignId, location, campaignManager, currentDate));
    act(() => {
      // we have to wait for the simulated useFocusEffect to run
      jest.advanceTimersToNextTimer();
    });
    const [campaignEnabled] = result.current;
    expect(campaignEnabled).toBe(true);

    expect(mixpanel.track).toHaveBeenCalledWith('Campaign viewed', {
      campaign: campaignId,
      'campaign-location': location,
    });
  });

  it('should return false for an disabled campaign', () => {
    const campaignId = 'test-disabled-campaign';
    const location = 'home-screen';
    const currentDate = new Date('2023-12-15');

    const {result} = renderHook(() => useCampaign(campaignId, location, campaignManager, currentDate));
    act(() => {
      // we have to wait for the simulated useFocusEffect to run
      jest.advanceTimersToNextTimer();
    });
    const [campaignEnabled] = result.current;
    expect(campaignEnabled).toBe(false);

    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  it('should return false for an enabled campaign when feature flag is off', () => {
    const campaignId = 'test-enabled-campaign';
    const location = 'home-screen';
    const currentDate = new Date('2023-12-15');

    (useFeatureFlag as jest.Mock).mockReturnValue(false);

    const {result} = renderHook(() => useCampaign(campaignId, location, campaignManager, currentDate));
    act(() => {
      // we have to wait for the simulated useFocusEffect to run
      jest.advanceTimersToNextTimer();
    });

    const [campaignEnabled] = result.current;
    expect(campaignEnabled).toBe(false);

    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  describe('trackInteraction', () => {
    it('should be a no-op if called when the campaign is disabled', () => {
      const campaignId = 'test-disabled-campaign';
      const location = 'home-screen';
      const currentDate = new Date('2023-12-15');

      const {result} = renderHook(() => useCampaign(campaignId, location, campaignManager, currentDate));
      act(() => {
        // we have to wait for the simulated useFocusEffect to run
        jest.advanceTimersToNextTimer();
      });
      const [campaignEnabled, trackInteraction] = result.current;
      expect(campaignEnabled).toBe(false);

      trackInteraction();
      expect(mixpanel.track).not.toHaveBeenCalled();
    });

    it('should send a single Mixpanel event if called when the campaign is enabled', () => {
      const campaignId = 'test-enabled-campaign';
      const location = 'home-screen';
      const currentDate = new Date('2023-12-15');

      const {result} = renderHook(() => useCampaign(campaignId, location, campaignManager, currentDate));
      act(() => {
        // we have to wait for the simulated useFocusEffect to run
        jest.advanceTimersToNextTimer();
      });
      const [campaignEnabled, trackInteraction] = result.current;
      expect(campaignEnabled).toBe(true);
      expect(mixpanel.track).toHaveBeenCalledWith('Campaign viewed', {
        campaign: campaignId,
        'campaign-location': location,
      });

      // Calling track interaction should send a mixpanel event on the first call, but not on subsequent calls
      trackInteraction();
      trackInteraction();
      trackInteraction();

      expect(mixpanel.track).toHaveBeenCalledTimes(2);
      expect(mixpanel.track).toHaveBeenLastCalledWith('Campaign interaction', {
        campaign: campaignId,
        'campaign-location': location,
      });
    });
  });
});
