export const ALWAYS_SHOW = 0;

/**
 * This object defines campaigns that can be shown to users. Each campaign has a start and end date, and a list of
 * locations where it can be shown. Each location has a frequency, indicating how many milliseconds must elapse between showings.
 * Some locations are unobtrusive and will show the campaign every time, while others like a modal popup will only
 * show at a slower rate.
 *
 * The campaign manager will keep track of how many times a campaign has been shown in each location, and will
 * automatically prevent the campaign from being shown faster than the frequency allows.
 *
 * It's recommended to use the `useCampaign` hook to check if a campaign should be shown, as it will handle all the common tasks involved:
 * - Checking the campaign feature flag
 * - Calling the campaign manager to get enabled state and track views
 * - Sending mixpanel events for campaign views and interactions
 * @see data/campaigns/useCampaign.ts
 */
const CAMPAIGNS = {
  'nwac-campaign-q4-2023': {
    enabled: true,
    allowedCenters: ['NWAC'],
    locations: {
      'observation-list-view': {
        frequency: ALWAYS_SHOW,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-01'),
      },
      'map-view': {
        frequency: 16 * 60 * 60 * 1000, // 16 hours
        startDate: new Date('2023-12-22'),
        endDate: new Date('2024-01-01'),
      },
    },
  },

  'sac-campaign-q4-2023': {
    enabled: true,
    allowedCenters: ['SNFAC'],
    locations: {
      'observation-list-view': {
        frequency: ALWAYS_SHOW,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-01'),
      },
      'map-view': {
        frequency: 16 * 60 * 60 * 1000, // 16 hours
        startDate: new Date('2023-12-22'),
        endDate: new Date('2024-01-01'),
      },
    },
  },

  // These are for unit testing purposes only - don't remove them
  'test-enabled-campaign': {
    enabled: true,
    locations: {
      'home-screen': {
        frequency: 2 * 60 * 60 * 1000, // 2 hours
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-01'),
      },
      'always-show': {
        frequency: ALWAYS_SHOW,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-01'),
      },
    },
  },
  'test-enabled-campaign-SNFAC-only': {
    enabled: true,
    allowedCenters: ['SNFAC'],
    locations: {
      'home-screen': {
        frequency: 2 * 60 * 60 * 1000, // 2 hours
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-01'),
      },
    },
  },
  'test-disabled-campaign': {
    enabled: false,
    locations: {
      'home-screen': {
        frequency: 2 * 60 * 60 * 1000, // 2 hours
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-01'),
      },
    },
  },
} as const;

export type Campaigns = typeof CAMPAIGNS;
export type CampaignId = keyof Campaigns;
export type CampaignLocations<T extends CampaignId> = Campaigns[T]['locations'];
export type CampaignLocationId<T extends CampaignId> = keyof CampaignLocations<T>;

export default CAMPAIGNS;
