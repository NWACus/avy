import React, {useEffect} from 'react';

import * as Updates from 'expo-updates';
import _ from 'lodash';

import {useNetInfo} from '@react-native-community/netinfo';
import {useAppState} from 'hooks/useAppState';
import {logger as parentLogger} from 'logger';
import {Alert} from 'react-native';

const logger = parentLogger.child({component: 'useEASUpdate'});

const tryCheckForUpdates = async (): Promise<boolean> => {
  logger.debug('checking for updates');
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      logger.info('update available, downloading');
      await Updates.fetchUpdateAsync();
      logger.info('update downloaded');
      return true;
    }
  } catch (error) {
    logger.debug('error checking for updates', {error});
  }
  return false;
};

// When returning to foreground, don't look for updates more frequently than every 5 minutes
const UPDATE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const tryCheckForUpdatesWithDebounce = _.debounce(tryCheckForUpdates, UPDATE_REFRESH_INTERVAL_MS, {leading: true});

// When this hook is mounted, it will do the following:
//
// - listen for appState changes (background/foreground)
// - listen for network changes (offline/online)
// - if the app is in the foreground and the network is online, check for updates
// - if an update is available, alert the user and then reload the app
//
// The checks are throttled to only happen every UPDATE_REFRESH_INTERVAL_MS
//
export const useEASUpdateChecker = () => {
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const appState = useAppState();

  useEffect(() => {
    void (async () => {
      if (appState === 'active') {
        logger.debug('appState changed to active, checking for updates');
        setUpdateAvailable((await tryCheckForUpdatesWithDebounce()) || false);
      }
    })();
  }, [appState, setUpdateAvailable]);

  const netInfo = useNetInfo();
  useEffect(() => {
    void (async () => {
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        logger.debug('network online, checking for updates');
        setUpdateAvailable((await tryCheckForUpdatesWithDebounce()) || false);
      }
    })();
  }, [netInfo, setUpdateAvailable]);

  useEffect(() => {
    if (updateAvailable) {
      logger.info('update available, reloading');
      Alert.alert('Update Available', 'A new version of the app is available. Press OK to apply the update.', [
        {
          text: 'OK',
          onPress: () => void Updates.reloadAsync(),
        },
      ]);
    }
  }, [updateAvailable]);

  return updateAvailable;
};
