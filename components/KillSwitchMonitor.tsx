import React, {useCallback, useEffect, useState} from 'react';
import {Modal} from 'react-native';

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import _ from 'lodash';
import PostHog, {PostHogProvider, useFeatureFlag, usePostHog} from 'posthog-react-native';

import {useNetInfo} from '@react-native-community/netinfo';
import NoConnection from 'assets/illustrations/NoConnection.svg';
import {Button} from 'components/content/Button';
import {Outcome} from 'components/content/Outcome';
import {VStack} from 'components/core';
import {BodyBlack} from 'components/text';
import {useAppState} from 'hooks/useAppState';
import {getUpdateGroupId, getUpdateTimeAsVersionString} from 'hooks/useEASUpdateStatus';
import {logger} from 'logger';
import {usePreferences} from 'Preferences';

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
      posthog.capture('App startup', {
        $set: {
          // Posthog automatically captures `Application.nativeBuildVersion` as `App Build`, but stores it as a string.
          // We additionally capture it as a number here, so that we can use < and > in feature flag rules.
          buildNumber: Number.parseInt(Application.nativeBuildVersion || '0'),
          updateGroupId: getUpdateGroupId(),
          updateBuildTime: getUpdateTimeAsVersionString(),
          channel: Updates.channel || 'development',
        },
      });
    }
  }, [posthog]);

  // We use the mixpanel user id (a unique UUID generated for each install of the app) as the posthog distinct id as well.
  const {
    preferences: {mixpanelUserId: distinctUserId},
  } = usePreferences();
  const [userIdentified, setUserIdentified] = useState(false);
  useEffect(() => {
    if (posthog && distinctUserId && !userIdentified) {
      posthog.identify(distinctUserId);
      setUserIdentified(true);
      logger.debug('identified user, reloading feature flags', {distinctUserId});
      tryReloadFeatureFlagsWithDebounce(posthog);
    }
  }, [posthog, distinctUserId, userIdentified]);

  const appState = useAppState();

  useEffect(() => {
    if (posthog && appState === 'active') {
      logger.debug('appState changed to active, reloading feature flags');
      tryReloadFeatureFlagsWithDebounce(posthog);
    }
  }, [appState, posthog]);

  const netInfo = useNetInfo();
  useEffect(() => {
    if (posthog && netInfo.isConnected && netInfo.isInternetReachable) {
      logger.debug('network online, reloading feature flags');
      tryReloadFeatureFlagsWithDebounce(posthog);
    }
  }, [netInfo, posthog]);

  const downForMaintenance = !!useFeatureFlag('down-for-maintenance');
  const updateRequired = !!useFeatureFlag(`update-required`);

  const reloadFeatureFlags = useCallback(() => void posthog?.reloadFeatureFlagsAsync(), [posthog]);

  return (
    <>
      <Modal visible={downForMaintenance}>
        <VStack style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}} justifyContent="center" alignItems="center" space={16} px={32} py={32}>
          <Outcome
            inline
            headline={'Oops!'}
            body={'We forgot our tire chains, we‘ll be right back.'}
            illustration={<NoConnection />}
            illustrationBottomMargin={-32}
            illustrationLeftMargin={-16}
          />
          <Button width={'100%'} buttonStyle="primary" onPress={reloadFeatureFlags}>
            <BodyBlack>Check again!</BodyBlack>
          </Button>
        </VStack>
      </Modal>
      <Modal visible={updateRequired && !downForMaintenance}>
        <VStack style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}} justifyContent="center" alignItems="center" space={16} px={32} py={32}>
          <Outcome
            inline
            headline={'Hold up!'}
            body={'Looks like you‘re missing a few essentials!\n\nHead to the App Store to get the latest version of Avy.'}
            illustration={<NoConnection />}
            illustrationBottomMargin={-32}
            illustrationLeftMargin={-16}
          />
          {/* TODO: uncomment when we have a real app store link for each platform
          <Button width={'100%'} buttonStyle="primary" onPress={() => Linking.openURL("itms-apps://itunes.apple.com/app/<app id here>")}>
            <BodyBlack>Take me there!</BodyBlack>
          </Button>
          */}
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
