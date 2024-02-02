import React, {useCallback, useEffect} from 'react';

import _ from 'lodash';

import * as Updates from 'expo-updates';

import {useNetInfo} from '@react-native-community/netinfo';
import {useAppState} from 'hooks/useAppState';
import {logger as parentLogger} from 'logger';

const logger = parentLogger.child({component: 'useEASUpdate'});

export const getUpdateGroupId = (): string => {
  if (Updates.isEmbeddedLaunch) {
    return 'embedded';
  }
  // Can be a NewManifest | BareManifest the `metadata` only exists se check for it first on a NewManifest
  const metadata: unknown = 'metadata' in Updates.manifest ? Updates.manifest.metadata : null;
  if (metadata && typeof metadata === 'object') {
    return _.get(metadata, 'updateGroup', 'n/a');
  }
  return 'n/a';
};

const checkUpdateAvailable = async (): Promise<boolean> => {
  logger.trace('checking for updates');
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      logger.info('update available!');
      return true;
    }
  } catch (error) {
    logger.trace('error checking for updates', {error});
  }
  return false;
};

// When this hook is mounted, it will do the following:
//
// - listen for appState changes (background/foreground)
// - listen for network changes (offline/online)
// - if the app is in the foreground and the network is online, check for updates
// - if an update is available, update the status
//
// The checks are throttled to only happen every UPDATE_REFRESH_INTERVAL_MS
//
type EASUpdateStatus = 'idle' | 'checking-for-update' | 'update-available' | 'downloading-update' | 'update-downloaded';
export const useEASUpdateStatus = () => {
  const updateStatusRef = React.useRef<EASUpdateStatus>('idle');
  const [updateStatusState, setUpdateStatusState] = React.useState<EASUpdateStatus>(updateStatusRef.current);
  const appState = useAppState();
  const netInfo = useNetInfo();

  // Wrapper to keep the state value and the ref in sync
  const setUpdateStatus = useCallback(
    (status: EASUpdateStatus) => {
      logger.trace('update status changed', {status});
      updateStatusRef.current = status;
      setUpdateStatusState(status);
    },
    [setUpdateStatusState],
  );

  useEffect(() => {
    void (async () => {
      if (updateStatusRef.current === 'idle' && appState === 'active' && netInfo.isConnected && netInfo.isInternetReachable) {
        logger.trace('appState changed to active, checking for updates');
        setUpdateStatus('checking-for-update');
        // the debounced method should block until the timeout elapses
        const updateAvailable = await checkUpdateAvailable();
        if (updateAvailable) {
          setUpdateStatus('update-available');
        } else {
          setUpdateStatus('idle');
        }
      }
    })();
  }, [appState, netInfo, setUpdateStatus]);

  useEffect(() => {
    void (async () => {
      if (updateStatusState === 'update-available') {
        logger.info('update available, downloading');
        setUpdateStatus('downloading-update');
        try {
          await Updates.fetchUpdateAsync();
          logger.info('download success!');
          setUpdateStatus('update-downloaded');
        } catch (error) {
          logger.warn({error}, 'error downloading update');
          setUpdateStatus('idle');
        }
      }
    })();
  }, [updateStatusState, setUpdateStatus]);

  return updateStatusState;
};
