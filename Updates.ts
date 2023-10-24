import * as Updates from 'expo-updates';
import {logger} from 'logger';

export type UpdateStatus = 'checking' | 'restarting' | 'ready';

export const updateCheck = async (): Promise<UpdateStatus> => {
  if (Updates.isEmergencyLaunch) {
    logger.warn('Emergency launch detected - update checking disabled');
    return 'ready';
  }
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return 'restarting';
  }
  return 'ready';
};
