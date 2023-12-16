/* ESLint reads references to mixpanel.track as attempts to call it */
/* eslint-disable @typescript-eslint/unbound-method */
import {renderHook} from '@testing-library/react-hooks';
import {useCampaign} from 'data/campaigns/useCampaign';
import mixpanel from 'mixpanel';
import {useFeatureFlag} from 'posthog-react-native';

jest.mock('mixpanel', () => ({
  track: jest.fn(),
}));

jest.mock('posthog-react-native', () => ({
  useFeatureFlag: jest.fn().mockReturnValue(true),
}));

describe('useCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for an enabled campaign', () => {
    const campaignId = 'test-enabled-campaign';
    const location = 'home-screen';
    const currentDate = new Date('2023-12-15');

    const {result} = renderHook(() => useCampaign(campaignId, location, currentDate));
    const [campaignEnabled] = result.current;
    expect(campaignEnabled).toBe(true);

    expect(mixpanel.track).toHaveBeenCalledWith('Campaign viewed', {
      campaignId,
      location,
    });
  });

  it('should return false for an disabled campaign', () => {
    const campaignId = 'test-disabled-campaign';
    const location = 'home-screen';
    const currentDate = new Date('2023-12-15');

    const {result} = renderHook(() => useCampaign(campaignId, location, currentDate));
    const [campaignEnabled] = result.current;
    expect(campaignEnabled).toBe(false);

    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  it('should return false for an enabled campaign when feature flag is off', () => {
    const campaignId = 'test-enabled-campaign';
    const location = 'home-screen';
    const currentDate = new Date('2023-12-15');

    (useFeatureFlag as jest.Mock).mockReturnValueOnce(false);

    const {result} = renderHook(() => useCampaign(campaignId, location, currentDate));
    const [campaignEnabled] = result.current;
    expect(campaignEnabled).toBe(false);

    expect(mixpanel.track).not.toHaveBeenCalled();
  });

  describe('trackInteraction', () => {
    it('should be a no-op if called when the campaign is disabled', () => {
      const campaignId = 'test-disabled-campaign';
      const location = 'home-screen';
      const currentDate = new Date('2023-12-15');

      const {result} = renderHook(() => useCampaign(campaignId, location, currentDate));
      const [campaignEnabled, trackInteraction] = result.current;
      expect(campaignEnabled).toBe(false);

      trackInteraction();
      expect(mixpanel.track).not.toHaveBeenCalled();
    });

    it('should send a single Mixpanel event if called when the campaign is enabled', () => {
      const campaignId = 'test-enabled-campaign';
      const location = 'home-screen';
      const currentDate = new Date('2023-12-15');

      const {result} = renderHook(() => useCampaign(campaignId, location, currentDate));
      const [campaignEnabled, trackInteraction] = result.current;
      expect(campaignEnabled).toBe(true);
      expect(mixpanel.track).toHaveBeenCalledWith('Campaign viewed', {
        campaignId,
        location,
      });

      // Calling track interaction should send a mixpanel event on the first call, but not on subsequent calls
      trackInteraction();
      trackInteraction();
      trackInteraction();

      expect(mixpanel.track).toHaveBeenCalledTimes(2);
      expect(mixpanel.track).toHaveBeenLastCalledWith('Campaign interaction', {
        campaignId,
        location,
      });
    });
  });
});
