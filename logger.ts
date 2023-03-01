import * as FileSystem from 'expo-file-system';
import {fileAsyncTransport, logger, mapConsoleTransport} from 'react-native-logs';

const LOG_PATH = FileSystem.cacheDirectory + 'log.txt';

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
log.info('Logger initialized');

export default log;
