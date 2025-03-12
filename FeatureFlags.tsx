// Create an object that stores feature flags as resolved by the PostHog server and as set by the user,
// storing state in memory and exposing hooks to consume and edit them.

import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';

import _ from 'lodash';

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

import {useNetInfo} from '@react-native-community/netinfo';
import PostHog, {useFeatureFlags, usePostHog} from 'posthog-react-native';
import {PostHogCore} from 'posthog-react-native/lib/posthog-core/src';

import {useAppState} from 'hooks/useAppState';
import {getUpdateGroupId} from 'hooks/useEASUpdateStatus';
import {logger} from 'logger';
import {usePreferences} from 'Preferences';

export type FeatureFlagsReturn = ReturnType<PostHogCore['getFeatureFlags']>;
export type FeatureFlags = Exclude<FeatureFlagsReturn, undefined>;

export type FeatureFlagKey = keyof FeatureFlags;
export type FeatureFlagValue = FeatureFlags[keyof FeatureFlags];

const defaultFeatureFlags: FeatureFlags = {};

interface FeatureFlagsContextType {
  featureFlags: FeatureFlags;

  clientSideFeatureFlagOverrides: FeatureFlags;
  setClientSideFeatureFlagOverrides: React.Dispatch<React.SetStateAction<FeatureFlags>>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  featureFlags: defaultFeatureFlags,

  clientSideFeatureFlagOverrides: defaultFeatureFlags,
  setClientSideFeatureFlagOverrides: () => undefined,
});

interface FeatureFlagsProviderProps {
  children?: ReactNode;
}

const tryReloadFeatureFlags = (posthog: PostHog) => {
  logger.debug('fetching feature flags');
  void (async () => {
    const featureFlags = await posthog.reloadFeatureFlagsAsync();
    logger.debug(`reloaded feature flags: ${JSON.stringify(featureFlags)}`);
  })();
};

// In release and preview mode, When returning to foreground, don't fetch feature flags more frequently than every 30 minutes
// In development mode, refresh every time we return from foreground
const FEATURE_FLAG_REFRESH_INTERVAL_MS = Updates.channel ? 30 * 60 * 1000 : 0;
const tryReloadFeatureFlagsWithDebounce = _.debounce(tryReloadFeatureFlags, FEATURE_FLAG_REFRESH_INTERVAL_MS);

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({children}) => {
  const postHog = usePostHog();
  const [registered, setRegistered] = React.useState(false);
  useEffect(() => {
    if (postHog && !registered) {
      postHog.register({
        // Posthog automatically captures `Application.nativeBuildVersion` as `App Build`, but stores it as a string.
        // We additionally capture it as a number here, so that we can use < and > in feature flag rules.
        buildNumber: Number.parseInt(Application.nativeBuildVersion || '0'),
        updateGroupId: getUpdateGroupId(),
        updateBuildTime: process.env.EXPO_PUBLIC_GIT_REVISION as string,
        channel: Updates.channel || 'development',
      });
      logger.debug('registered user');
      setRegistered(true);
    }
  }, [postHog, registered, setRegistered]);
  // We use the mixpanel user id (a unique UUID generated for each install of the app) as the posthog distinct id as well.
  const {
    preferences: {mixpanelUserId: distinctUserId},
  } = usePreferences();
  const [userIdentified, setUserIdentified] = useState(false);
  useEffect(() => {
    if (postHog && distinctUserId && !userIdentified && registered) {
      postHog.identify(distinctUserId);
      setUserIdentified(true);
      logger.debug('identified user, reloading feature flags', {distinctUserId});
      tryReloadFeatureFlagsWithDebounce(postHog);
    }
  }, [postHog, distinctUserId, userIdentified, registered]);

  const appState = useAppState();
  useEffect(() => {
    if (postHog && appState === 'active' && registered && userIdentified) {
      logger.debug('appState changed to active, reloading feature flags');
      tryReloadFeatureFlagsWithDebounce(postHog);
    }
  }, [appState, postHog, registered, userIdentified]);

  const netInfo = useNetInfo();
  useEffect(() => {
    if (postHog && netInfo.isConnected && netInfo.isInternetReachable && registered && userIdentified) {
      logger.debug('network online, reloading feature flags');
      tryReloadFeatureFlagsWithDebounce(postHog);
    }
  }, [netInfo, postHog, registered, userIdentified]);

  // TODO: why does TS thing useFeatureFlags() returns an any? it has a concrete return type ...
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const featureFlags: FeatureFlags = useFeatureFlags();
  const [clientSideFeatureFlagOverrides, setClientSideFeatureFlagOverrides] = useState<FeatureFlags>({});

  return (
    <FeatureFlagsContext.Provider
      value={{
        featureFlags: featureFlags,
        clientSideFeatureFlagOverrides: clientSideFeatureFlagOverrides,
        setClientSideFeatureFlagOverrides: setClientSideFeatureFlagOverrides,
      }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useAllFeatureFlags = (): FeatureFlags | undefined => {
  const flags = useContext(FeatureFlagsContext);
  return _.merge({}, flags.featureFlags, flags.clientSideFeatureFlagOverrides);
};

export const useOneFeatureFlag = (key: FeatureFlagKey): FeatureFlagValue | undefined => {
  const flags = useContext(FeatureFlagsContext);
  const resolved: FeatureFlags = _.merge({}, flags.featureFlags, flags.clientSideFeatureFlagOverrides);
  return resolved && resolved[key];
};

export const useDebugFeatureFlags = () => useContext(FeatureFlagsContext);
