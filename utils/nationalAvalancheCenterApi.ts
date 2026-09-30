import {RequestedTime, toISOStringZulu} from 'utils/date';

export type NACApiVersion = 'v2' | 'v3';

export const NAC_API_V3_FLAG_KEY = 'nac-api-v3';

export const nacApiVersion = (flagEnabled: boolean): NACApiVersion => {
  return flagEnabled ? 'v3' : 'v2';
};

export const resolveSessionNACApiVersion = (lockedVersion: NACApiVersion | undefined, flagEnabled: boolean): NACApiVersion =>
  lockedVersion === 'v2' ? 'v2' : nacApiVersion(flagEnabled);

export const nacUrl = (nationalAvalancheCenterHost: string, apiVersion: NACApiVersion, path: string): string => `${nationalAvalancheCenterHost}/${apiVersion}/public/${path}`;

export const asOfParams = (apiVersion: NACApiVersion, requestedTime: RequestedTime): Record<string, string> =>
  apiVersion === 'v3' && requestedTime !== 'latest' ? {as_of: toISOStringZulu(requestedTime)} : {};
