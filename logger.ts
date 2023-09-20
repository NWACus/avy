import * as FileSystem from 'expo-file-system';
import {LogBox} from 'react-native';

// react-native-logs always logs to FS.documentDirectory
const LOG_PATH = 'log.txt';
export const logFilePath = String(FileSystem.documentDirectory) + LOG_PATH;

// Always delete the log file on startup
if (process.env.NODE_ENV !== 'test') {
  void (async () => {
    await FileSystem.deleteAsync(logFilePath, {idempotent: true});
  })();
}

if (process.env.EXPO_PUBLIC_DISABLE_LOGBOX) {
  LogBox.ignoreAllLogs(true);
}
