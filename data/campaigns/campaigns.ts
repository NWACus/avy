export const UNLIMITED_VIEWS_PER_DAY = -1;

const CAMPAIGNS = {
  'campaign-q4-2023': {
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    enabled: true,
    locations: {
      'observation-list-view': {
        viewsPerDay: UNLIMITED_VIEWS_PER_DAY,
      },
      'map-view': {
        viewsPerDay: 1,
      },
    },
  },

  // These are for unit testing purposes only - don't remove them
  'test-enabled-campaign': {
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    enabled: true,
    locations: {
      'home-screen': {
        viewsPerDay: 3,
      },
      'always-show': {
        viewsPerDay: UNLIMITED_VIEWS_PER_DAY,
      },
    },
  },
  'test-disabled-campaign': {
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    enabled: false,
    locations: {
      'home-screen': {
        viewsPerDay: 3,
      },
    },
  },
} as const;

export type Campaigns = typeof CAMPAIGNS;
export type CampaignId = keyof Campaigns;
export type CampaignLocationId<T extends CampaignId> = keyof Campaigns[T]['locations'];

export default CAMPAIGNS;
