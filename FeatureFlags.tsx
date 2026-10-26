// Create an object that stores feature flags as resolved by the PostHog server and as set by the user,
// storing state in memory and exposing hooks to consume and edit them.

import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';

import _ from 'lodash';

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

import {useNetInfo} from '@react-native-community/netinfo';
import PostHog, {useFeatureFlags, usePostHog} from 'posthog-react-native';

import {Analytics, useAnalytics} from 'hooks/useAnalytics';
import {useAppState} from 'hooks/useAppState';
import {getUpdateGroupId} from 'hooks/useEASUpdateStatus';
import {logger} from 'logger';
import {usePreferences} from 'Preferences';
import {NAC_API_V3_FLAG_KEY, NACApiVersion, nacApiVersion, resolveSessionNACApiVersion} from 'utils/nationalAvalancheCenterApi';

export type FeatureFlagsReturn = ReturnType<PostHog['getFeatureFlags']>;
export type FeatureFlags = Exclude<FeatureFlagsReturn, undefined>;

export type FeatureFlagKey = keyof FeatureFlags;
export type FeatureFlagValue = FeatureFlags[keyof FeatureFlags];

const defaultFeatureFlags: FeatureFlags = {};
const developmentFeatureFlags: FeatureFlags = {[NAC_API_V3_FLAG_KEY]: true};
const fallbackFeatureFlags: FeatureFlags = Updates.channel ? defaultFeatureFlags : developmentFeatureFlags;

interface FeatureFlagsContextType {
  featureFlags: FeatureFlags;
  featureFlagsLoaded: boolean;
  nacApiVersion: NACApiVersion;

  clientSideFeatureFlagOverrides: FeatureFlags;
  setClientSideFeatureFlagOverrides: React.Dispatch<React.SetStateAction<FeatureFlags>>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  featureFlags: defaultFeatureFlags,
  featureFlagsLoaded: false,
  nacApiVersion: nacApiVersion(false),

  clientSideFeatureFlagOverrides: defaultFeatureFlags,
  setClientSideFeatureFlagOverrides: () => undefined,
});

interface FeatureFlagsProviderProps {
  children?: ReactNode;
}

const tryReloadFeatureFlags = (analytics: Analytics) => {
  logger.debug('fetching feature flags');
  void (async () => {
    try {
      const featureFlags = await analytics.reloadFeatureFlags();
      logger.debug(`reloaded feature flags: ${JSON.stringify(featureFlags)}`);
    } catch (error) {
      logger.error({error}, 'failed to reload feature flags');
    }
  })();
};

// In release and preview mode, When returning to foreground, don't fetch feature flags more frequently than every 30 minutes
// In development mode, refresh every time we return from foreground
const FEATURE_FLAG_REFRESH_INTERVAL_MS = Updates.channel ? 30 * 60 * 1000 : 0;
const tryReloadFeatureFlagsWithDebounce = _.debounce(tryReloadFeatureFlags, FEATURE_FLAG_REFRESH_INTERVAL_MS);

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({children}) => {
  const analytics = useAnalytics();
  const [registered, setRegistered] = React.useState(false);
  useEffect(() => {
    if (!registered) {
      analytics.register({
        // Posthog automatically captures `Application.nativeBuildVersion` as `App Build`, but stores it as a string.
        // We additionally capture it as a number here, so that we can use < and > in feature flag rules.
        buildNumber: Number.parseInt(Application.nativeBuildVersion || '0'),
        updateGroupId: getUpdateGroupId(),
        updateBuildTime: process.env.EXPO_PUBLIC_GIT_REVISION as string,
        environment: Updates.channel || 'development',
        source: 'nwacus/avy',
      });
      logger.debug('registered user');
      setRegistered(true);
    }
  }, [analytics, registered, setRegistered]);
  // We use the mixpanel user id (a unique UUID generated for each install of the app) as the posthog distinct id as well.
  const {
    preferences: {mixpanelUserId: distinctUserId},
  } = usePreferences();
  const [userIdentified, setUserIdentified] = useState(false);
  useEffect(() => {
    if (distinctUserId && !userIdentified && registered) {
      analytics.identify(distinctUserId);
      setUserIdentified(true);
      logger.debug('identified user, reloading feature flags', {distinctUserId});
      tryReloadFeatureFlagsWithDebounce(analytics);
    }
  }, [analytics, distinctUserId, userIdentified, registered]);

  const appState = useAppState();
  useEffect(() => {
    if (appState === 'active' && registered && userIdentified) {
      logger.debug('appState changed to active, reloading feature flags');
      tryReloadFeatureFlagsWithDebounce(analytics);
    }
  }, [appState, analytics, registered, userIdentified]);

  const netInfo = useNetInfo();
  useEffect(() => {
    if (netInfo.isConnected && netInfo.isInternetReachable && registered && userIdentified) {
      logger.debug('network online, reloading feature flags');
      tryReloadFeatureFlagsWithDebounce(analytics);
    }
  }, [netInfo, analytics, registered, userIdentified]);

  const postHog = usePostHog();
  const [postHogReady, setPostHogReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await postHog?.ready();
      } catch (error) {
        logger.error({error}, 'failed waiting for posthog to be ready');
      }
      if (!cancelled) {
        setPostHogReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postHog]);

  const featureFlags: FeatureFlags = useFeatureFlags() ?? fallbackFeatureFlags;
  const [clientSideFeatureFlagOverrides, setClientSideFeatureFlagOverrides] = useState<FeatureFlags>({});

  const nacApiV3FlagEnabled = !!featureFlags[NAC_API_V3_FLAG_KEY];
  const [lockedNACApiVersion, setLockedNACApiVersion] = useState<NACApiVersion>();
  const sessionNACApiVersion = postHogReady ? resolveSessionNACApiVersion(lockedNACApiVersion, nacApiV3FlagEnabled) : undefined;
  if (sessionNACApiVersion !== lockedNACApiVersion) {
    setLockedNACApiVersion(sessionNACApiVersion);
  }
  const nacApiV3FlagOverride = clientSideFeatureFlagOverrides[NAC_API_V3_FLAG_KEY];
  const effectiveNACApiVersion = nacApiV3FlagOverride !== undefined ? nacApiVersion(!!nacApiV3FlagOverride) : sessionNACApiVersion ?? nacApiVersion(nacApiV3FlagEnabled);

  return (
    <FeatureFlagsContext.Provider
      value={{
        featureFlags: featureFlags,
        featureFlagsLoaded: postHogReady,
        nacApiVersion: effectiveNACApiVersion,
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
  return flags.clientSideFeatureFlagOverrides[key] ?? flags.featureFlags[key];
};

export const useFeatureFlagsLoaded = (): boolean => useContext(FeatureFlagsContext).featureFlagsLoaded;

export const useSessionNACApiVersion = (): NACApiVersion => useContext(FeatureFlagsContext).nacApiVersion;

export const useDebugFeatureFlags = () => useContext(FeatureFlagsContext);
