import * as Updates from 'expo-updates';
import {logger} from 'logger';

export type UpdateStatus = 'checking' | 'restarting' | 'ready';

export const startupUpdateCheck = async (): Promise<UpdateStatus> => {
  if (Updates.isEmergencyLaunch) {
    logger.warn('Emergency launch detected - update checking disabled');
    return 'ready';
  }
  if (Updates.channel !== 'preview' && Updates.channel !== 'release') {
    logger.debug(`Unknown update channel '${Updates.channel || 'null'}' - update checking disabled`);
    return 'ready';
  }

  try {
    // After 10 seconds, we'll resolve as ready no matter what
    const timeout = new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 10000));
    const update = await Promise.race([timeout, Updates.checkForUpdateAsync()]);
    if (update === 'timeout') {
      logger.debug('checkForUpdateAsync timed out');
      return 'ready';
    }
    if (update.isAvailable) {
      // An update is available! Let's create a new 10 second timer and try to get it installed.
      const timeout = new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 10000));
      const fetch = await Promise.race([timeout, Updates.fetchUpdateAsync()]);
      if (fetch === 'timeout') {
        logger.debug('fetchUpdateAsync timed out');
        return 'ready';
      }
      await Updates.reloadAsync();
      return 'restarting';
    } else {
      logger.debug('No update available');
    }
  } catch (error) {
    logger.warn({error}, 'Error checking for updates');
  }
  return 'ready';
};
