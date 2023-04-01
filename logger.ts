import * as FileSystem from 'expo-file-system';

// react-native-logs always logs to FS.documentDirectory
const LOG_PATH = 'log.txt';
export const logFilePath = FileSystem.documentDirectory + LOG_PATH;

// Always delete the log file on startup
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await FileSystem.deleteAsync(logFilePath, {idempotent: true});
  })();
}
