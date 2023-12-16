export type Campaign = {
  startDate: Date;
  endDate: Date;
  enabled: boolean;
  locations: Record<
    string,
    {
      // -1 means unlimited
      viewsPerDay: number;
    }
  >;
};
export type Campaigns = Record<string, Campaign>;
export const UNLIMITED_VIEWS_PER_DAY = -1;

const CAMPAIGNS: Campaigns = {
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
};

export type CampaignId = keyof typeof CAMPAIGNS;

export default CAMPAIGNS;
