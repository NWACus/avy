import {MediaType, mediaItemSchema} from 'types/nationalAvalancheCenter/schemas';

describe('MediaItem parsing', () => {
  it('parses a PDF media item as type pdf', () => {
    const item = {
      id: 'c0644e6a-92b3-11ee-9bd0-c3e82ed6f997',
      center_id: 'snfac',
      url: {
        original: 'https://avalanche-org-media-staging.s3.us-west-2.amazonaws.com/alpine_meadows_656de600952a3.pdf',
      },
      type: 'pdf',
      status: 'published',
      title: 'Apline Meadows',
      caption: 'Apline Meadows',
      taken_by: null,
      forecast_zone_id: ['293'],
      location: null,
      category: null,
      date_taken: null,
      date_created: '2023-12-04T14:45:20+00:00',
      date_updated: '2023-12-04T14:45:21+00:00',
      source: null,
      access: null,
      favorite: false,
    };
    const mediaItem = mediaItemSchema.parse(item);
    expect(mediaItem.type).toEqual(MediaType.PDF);
  });
});
