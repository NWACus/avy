import {RequestedTime, toISOStringZulu} from 'utils/date';

export type NACApiVersion = 'v2' | 'v3';

export const NAC_V3_KILL_SWITCH = 'nac-v3-kill-switch';

export const nacApiVersion = (killSwitchEnabled: boolean): NACApiVersion => (killSwitchEnabled ? 'v2' : 'v3');

export const nacUrl = (nationalAvalancheCenterHost: string, apiVersion: NACApiVersion, path: string): string => `${nationalAvalancheCenterHost}/${apiVersion}/public/${path}`;

export const asOfParams = (apiVersion: NACApiVersion, requestedTime: RequestedTime): Record<string, string> =>
  apiVersion === 'v3' && requestedTime !== 'latest' ? {as_of: toISOStringZulu(requestedTime)} : {};
