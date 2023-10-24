import * as Updates from 'expo-updates';
import {logger} from 'logger';
import {Alert} from 'react-native';

export type UpdateStatus = 'checking' | 'downloading' | 'ready';

export const updateCheck = async (): Promise<UpdateStatus> => {
  if (Updates.isEmergencyLaunch) {
    logger.warn('Emergency launch detected - update checking disabled');
    return 'ready';
  }
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await new Promise<void>(resolve => {
      Alert.alert('Update Available', 'Avy needs to restart to apply an update.', [
        {
          text: 'OK',
          onPress: () => {
            Updates.reloadAsync()
              .then(() => resolve())
              .catch(() => resolve());
          },
          style: 'default',
        },
      ]);
      return 'downloading';
    });
  }
  return 'ready';
};
