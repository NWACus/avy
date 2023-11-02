import React, {useCallback, useEffect} from 'react';

import * as Updates from 'expo-updates';
import _ from 'lodash';

import {useNetInfo} from '@react-native-community/netinfo';
import {useAppState} from 'hooks/useAppState';
import {logger as parentLogger} from 'logger';

const logger = parentLogger.child({component: 'useEASUpdate'});

const updateAvailable = async (): Promise<boolean> => {
  logger.debug('checking for updates');
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      logger.info('update available, downloading');
      return true;
    }
  } catch (error) {
    logger.debug('error checking for updates', {error});
  }
  return false;
};

// When returning to foreground, don't look for updates more frequently than every 5 minutes
const UPDATE_REFRESH_INTERVAL_MS = 0; // 5 * 60 * 1000;
const updateAvailableDebounced = _.debounce(updateAvailable, UPDATE_REFRESH_INTERVAL_MS, {leading: true});

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
      logger.debug('update status changed', {status});
      updateStatusRef.current = status;
      setUpdateStatusState(status);
    },
    [setUpdateStatusState],
  );

  useEffect(() => {
    void (async () => {
      if (updateStatusRef.current === 'idle' && appState === 'active' && netInfo.isConnected && netInfo.isInternetReachable) {
        logger.debug('appState changed to active, checking for updates');
        setUpdateStatus('checking-for-update');
        // the debounced method should block until the timeout elapses
        const updateAvailable = (await updateAvailableDebounced()) || false;
        // check again and make sure we're still in the idle state before
        // changing to the update-available state
        if (updateAvailable && updateStatusRef.current === 'idle') {
          setUpdateStatus('update-available');
        } else {
          setUpdateStatus('idle');
        }
      }
    })();
  }, [appState, netInfo, setUpdateStatus, updateStatusRef]);

  useEffect(() => {
    void (async () => {
      if (updateStatusRef.current === 'update-available') {
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
  }, [updateStatusRef, setUpdateStatus]);

  return updateStatusState;
};
