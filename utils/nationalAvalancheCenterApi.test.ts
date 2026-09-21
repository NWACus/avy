import {asOfParams, nacApiVersion, nacUrl} from 'utils/nationalAvalancheCenterApi';

describe('nacApiVersion', () => {
  it('returns v2 when the kill switch is enabled', () => {
    expect(nacApiVersion(true)).toEqual('v2');
  });

  it('returns v3 when the kill switch is disabled', () => {
    expect(nacApiVersion(false)).toEqual('v3');
  });
});

describe('nacUrl', () => {
  it('builds a v3 url', () => {
    expect(nacUrl('https://api.avalanche.org', 'v3', 'product')).toEqual('https://api.avalanche.org/v3/public/product');
  });

  it('builds a v2 url', () => {
    expect(nacUrl('https://api.avalanche.org', 'v2', 'product')).toEqual('https://api.avalanche.org/v2/public/product');
  });

  it('builds urls with nested paths', () => {
    expect(nacUrl('https://api.avalanche.org', 'v3', 'products/map-layer/CBAC')).toEqual('https://api.avalanche.org/v3/public/products/map-layer/CBAC');
  });

  it('respects a staging host', () => {
    expect(nacUrl('https://staging-api.avalanche.org', 'v3', 'avalanche-center/NWAC')).toEqual('https://staging-api.avalanche.org/v3/public/avalanche-center/NWAC');
  });
});

describe('asOfParams', () => {
  const requestedTime = new Date('2026-01-15T08:30:00Z');

  it('formats a historical time as an ISO 8601 string with a Z suffix on v3', () => {
    expect(asOfParams('v3', requestedTime)).toEqual({as_of: '2026-01-15T08:30:00Z'});
  });

  it('is empty for the latest data on v3', () => {
    expect(asOfParams('v3', 'latest')).toEqual({});
  });

  it('is empty on v2 even for a historical time, since v2 has no as_of parameter', () => {
    expect(asOfParams('v2', requestedTime)).toEqual({});
  });

  it('is empty on v2 for the latest data', () => {
    expect(asOfParams('v2', 'latest')).toEqual({});
  });

  it('converts a non-UTC time to UTC', () => {
    expect(asOfParams('v3', new Date('2026-01-15T00:30:00-08:00'))).toEqual({as_of: '2026-01-15T08:30:00Z'});
  });
});
