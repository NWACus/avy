import * as FileSystem from 'expo-file-system';
import {fileAsyncTransport, logger, mapConsoleTransport} from 'react-native-logs';

// react-native-logs always logs to FS.documentDirectory
const LOG_PATH = 'log.txt';
export const logFilePath = FileSystem.documentDirectory + LOG_PATH;

// Always delete the log file on startup
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await FileSystem.deleteAsync(logFilePath);
  })();
}

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  // filesystem isn't available in test
  transport: process.env.NODE_ENV !== 'test' ? [mapConsoleTransport, fileAsyncTransport] : [mapConsoleTransport],
  transportOptions: {
    mapLevels: {
      debug: 'log',
      info: 'info',
      warn: 'warn',
      error: 'error',
    },
    FS: FileSystem,
    fileName: LOG_PATH,
  },
};

const log = logger.createLogger(config);

export default log;
