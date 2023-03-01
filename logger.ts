import * as FileSystem from 'expo-file-system';
import {fileAsyncTransport, logger, mapConsoleTransport} from 'react-native-logs';

// react-native-logs always logs to FS.documentDirectory
const LOG_PATH = 'log.txt';
export const logFilePath = FileSystem.documentDirectory + LOG_PATH;

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  transport: [mapConsoleTransport, fileAsyncTransport],
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
