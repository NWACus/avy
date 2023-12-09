import {MediaType, mediaItemSchema} from 'types/nationalAvalancheCenter/schemas';

describe('MediaItem parsing', () => {
  it('parses a PDF media item as type pdf', () => {
    const item = {
      id: 'c0644e6a-92b3-11ee-9bd0-c3e82ed6f997',
      url: {
        original: 'https://avalanche-org-media-staging.s3.us-west-2.amazonaws.com/alpine_meadows_656de600952a3.pdf',
      },
      type: 'pdf',
    };
    const mediaItem = mediaItemSchema.parse(item);
    expect(mediaItem.type).toEqual(MediaType.PDF);
  });

  it('parses an unrecognized media type as `unknown`', () => {
    const item = {
      id: 'c0644e6a-92b3-11ee-9bd0-c3e82ed6f997',
      url: {
        original: 'https://avalanche-org-media-staging.s3.us-west-2.amazonaws.com/alpine_meadows_656de600952a3.pdf',
      },
      type: 'foo',
    };
    const mediaItem = mediaItemSchema.parse(item);
    expect(mediaItem.type).toEqual(MediaType.Unknown);
  });
});
