import React, {useEffect} from 'react';
import {Modal} from 'react-native';

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import _ from 'lodash';
import PostHog, {PostHogProvider, useFeatureFlag, usePostHog} from 'posthog-react-native';

import NoConnection from 'assets/illustrations/NoConnection.svg';
import {Outcome} from 'components/content/Outcome';
import {VStack} from 'components/core';
import {useAppState} from 'hooks/useAppState';
import {logger} from 'logger';

type KillSwitchMonitorProps = {
  children: React.ReactNode;
};

const tryReloadFeatureFlags = (posthog: PostHog) => {
  logger.debug('fetching feature flags');
  void posthog.reloadFeatureFlagsAsync();
};

// In release and preview mode, When returning to foreground, don't fetch feature flags more frequently than every 30 minutes
// In development mode, refresh every time we return from foreground
const FEATURE_FLAG_REFRESH_INTERVAL_MS = Updates.channel ? 30 * 60 * 1000 : 0;
const tryReloadFeatureFlagsWithDebounce = _.debounce(tryReloadFeatureFlags, FEATURE_FLAG_REFRESH_INTERVAL_MS);

const KillSwitchMonitor: React.FC<KillSwitchMonitorProps> = ({children}) => {
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) {
      // At some point we'll use appVersion to force upgrades.
      posthog.capture('App startup', {$set: {appVersion: Application.nativeApplicationVersion, appBuildNumber: Application.nativeBuildVersion}});
    }
  }, [posthog]);

  const appState = useAppState();

  useEffect(() => {
    if (posthog && appState === 'active') {
      logger.debug('appState changed to active, reloading feature flags');
      tryReloadFeatureFlagsWithDebounce(posthog);
    }
  }, [appState, posthog]);

  const downForMaintenance = useFeatureFlag('down-for-maintenance');

  return (
    <>
      <Modal visible={!!downForMaintenance}>
        <VStack style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}} justifyContent="center" alignItems="stretch" px={32} py={32}>
          <Outcome
            headline={'Oops!'}
            body={'We forgot our tire chains, we‘ll be right back.'}
            illustration={<NoConnection />}
            illustrationBottomMargin={-32}
            illustrationLeftMargin={-16}
            onRetry={() => void posthog?.reloadFeatureFlagsAsync()}
          />
        </VStack>
      </Modal>
      {children}
    </>
  );
};

const PostHogProviderWrapper: React.FC<KillSwitchMonitorProps> = ({children}) => {
  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_POSTHOG_API_KEY) {
      logger.warn('EXPO_PUBLIC_POSTHOG_API_KEY key not found in environment, KillSwitchMonitor disabled', {});
    }
  }, []);

  return process.env.EXPO_PUBLIC_POSTHOG_API_KEY ? (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY}
      options={{
        host: 'https://app.posthog.com',
      }}>
      <KillSwitchMonitor>{children}</KillSwitchMonitor>
    </PostHogProvider>
  ) : (
    <>{children}</>
  );
};

export default PostHogProviderWrapper;
