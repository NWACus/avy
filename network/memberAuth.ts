// POC 1 (ADR 026): AvyApp as a Better Auth client of AvyWeb's Member auth server.
// Everything here backs the Member Auth debug screen; nothing user-facing calls it yet.

import {expoClient} from '@better-auth/expo/client';
import {createAuthClient} from 'better-auth/client';
import {anonymousClient, emailOTPClient} from 'better-auth/client/plugins';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';

// The server's `advanced.cookiePrefix`. The expo client only persists Set-Cookie headers whose
// names start with this, so it must match or the session never reaches SecureStore.
const COOKIE_PREFIX = 'avy';
const STORAGE_PREFIX = 'avy';
// Only used to build the `expo-origin` header; the server must list `avy://` in trustedOrigins.
export const AVY_SCHEME = 'avy';

const INSTALL_ID_KEY = 'avy_install_id';
const DEVICE_SECRET_KEY = 'avy_device_secret';

const createMemberAuthClient = (baseURL: string) =>
  createAuthClient({
    baseURL,
    basePath: '/api/auth',
    plugins: [
      anonymousClient(),
      emailOTPClient(),
      expoClient({
        scheme: AVY_SCHEME,
        storagePrefix: STORAGE_PREFIX,
        cookiePrefix: COOKIE_PREFIX,
        storage: SecureStore,
      }),
    ],
  });

export type MemberAuthClient = ReturnType<typeof createMemberAuthClient>;

const clients = new Map<string, MemberAuthClient>();

/** One client per host, so the staging toggle and a local override each keep their own session cookie. */
export const getMemberAuthClient = (baseURL: string): MemberAuthClient => {
  let client = clients.get(baseURL);
  if (!client) {
    client = createMemberAuthClient(baseURL);
    clients.set(baseURL, client);
  }
  return client;
};

export interface DeviceIdentity {
  installId: string;
  secret: string;
}

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const readDeviceIdentity = async (): Promise<DeviceIdentity | null> => {
  const [installId, secret] = await Promise.all([SecureStore.getItemAsync(INSTALL_ID_KEY), SecureStore.getItemAsync(DEVICE_SECRET_KEY)]);
  return installId && secret ? {installId, secret} : null;
};

/** Created lazily, on the first action that needs an identity. SecureStore only, never AsyncStorage (ADR 026). */
export const ensureDeviceIdentity = async (): Promise<DeviceIdentity> => {
  const existing = await readDeviceIdentity();
  if (existing) {
    return existing;
  }
  const identity = {installId: Crypto.randomUUID(), secret: toBase64Url(Crypto.getRandomBytes(32))};
  await SecureStore.setItemAsync(INSTALL_ID_KEY, identity.installId);
  await SecureStore.setItemAsync(DEVICE_SECRET_KEY, identity.secret);
  return identity;
};

// The expo client's own keys. Deleting the base key is enough: it ignores chunks without one.
const SESSION_KEYS = [`${STORAGE_PREFIX}_cookie`, `${STORAGE_PREFIX}_session_data`];

/** Simulates a lost or expired session while keeping the device identity, so flow B falls back to the device secret. */
export const dropStoredSession = async (): Promise<void> => {
  await Promise.all(SESSION_KEYS.map(key => SecureStore.deleteItemAsync(key)));
};

/** Wipes the device identity and the stored session cookie and cache. */
export const forgetDevice = async (): Promise<void> => {
  await Promise.all([INSTALL_ID_KEY, DEVICE_SECRET_KEY, ...SESSION_KEYS].map(key => SecureStore.deleteItemAsync(key)));
};

export class MemberAuthError extends Error {
  constructor(public step: string, public status: number | undefined, message: string | undefined) {
    super(`${step} failed${status ? ` (${status})` : ''}: ${message ?? 'unknown error'}`);
  }
}

type BetterFetchResult<T> = {data: T | null; error: {status?: number; message?: string} | null};

const unwrap = <T>(step: string, result: BetterFetchResult<T>): T => {
  if (result.error || result.data == null) {
    throw new MemberAuthError(step, result.error?.status, result.error?.message);
  }
  return result.data;
};

export const getSession = async (client: MemberAuthClient) => {
  const {data, error} = await client.getSession();
  if (error) {
    throw new MemberAuthError('get-session', error.status, error.message);
  }
  return data;
};

export const registerDevice = async (client: MemberAuthClient, pushToken?: string) => {
  const {installId, secret} = await ensureDeviceIdentity();
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined;
  return unwrap(
    'device/register',
    await client.$fetch<{device: {id: string; installId: string}}>('/device/register', {method: 'POST', body: {installId, secret, pushToken, platform}}),
  );
};

/** Flow A: an Anonymous Member and a registered Device, created on first need. */
export const signInAnonymously = async (client: MemberAuthClient) => {
  if (!(await getSession(client))) {
    unwrap('sign-in/anonymous', await client.signIn.anonymous());
  }
  await registerDevice(client);
  return getSession(client);
};

export type RestoreOutcome = 'session' | 'device' | 'linked' | 'unknown-device' | 'no-identity';

/**
 * Flow B: on relaunch, keep the stored session if it is still good, otherwise trade the device secret
 * for a fresh one. `linked` means the Member was linked elsewhere and must sign in with email or Google.
 */
export const restoreSession = async (client: MemberAuthClient): Promise<RestoreOutcome> => {
  if (await getSession(client)) {
    return 'session';
  }
  const identity = await readDeviceIdentity();
  if (!identity) {
    return 'no-identity';
  }
  const {error} = await client.$fetch('/sign-in/device', {method: 'POST', body: identity});
  if (!error) {
    return 'device';
  }
  if (error.status === 403) {
    return 'linked';
  }
  if (error.status === 401) {
    return 'unknown-device';
  }
  throw new MemberAuthError('sign-in/device', error.status, error.message);
};

export const sendEmailOtp = async (client: MemberAuthClient, email: string) => {
  unwrap('email-otp/send-verification-otp', await client.emailOtp.sendVerificationOtp({email, type: 'sign-in'}));
};

/** Flow C: verifying the OTP with the anonymous session still stored links it server-side. */
export const verifyEmailOtp = async (client: MemberAuthClient, email: string, otp: string) => {
  unwrap('sign-in/email-otp', await client.signIn.emailOtp({email, otp}));
  await registerDevice(client);
  return getSession(client);
};

/**
 * Flow D: trade a native Google idToken for a session. The expo client deliberately drops the stored
 * cookie on idToken sign-ins, which would skip anonymous linking, so we send it (and the origin the
 * server needs to accept a cookie-bearing POST) ourselves.
 */
export const signInWithGoogleIdToken = async (client: MemberAuthClient, idToken: string) => {
  const cookie = await client.getCookie();
  const headers: Record<string, string> = cookie ? {cookie, 'expo-origin': Linking.createURL('', {scheme: AVY_SCHEME})} : {};
  unwrap('sign-in/social', await client.signIn.social({provider: 'google', idToken: {token: idToken}, fetchOptions: {headers}}));
  await registerDevice(client);
  return getSession(client);
};

export const signOut = async (client: MemberAuthClient) => {
  unwrap('sign-out', await client.signOut());
};

/** Emails a confirmation link; the Member is only deleted once it is followed. */
export const requestDeleteMember = async (client: MemberAuthClient, callbackURL: string) => {
  unwrap('delete-user', await client.deleteUser({callbackURL}));
};
