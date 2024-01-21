const CAMPAIGNS = {
  'campaign-q4-2023': {
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    enabled: true,
    viewsPerDay: 1,
  },

  // These are for unit testing purposes only - don't remove them
  'test-enabled-campaign': {
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    enabled: true,
    viewsPerDay: 3,
  },
  'test-disabled-campaign': {
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    enabled: false,
    viewsPerDay: 1,
  },
};

export type CampaignId = keyof typeof CAMPAIGNS;

export default CAMPAIGNS;
