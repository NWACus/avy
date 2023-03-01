import {logger, mapConsoleTransport} from 'react-native-logs';

// import RNFS from "react-native-fs";

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  transport: mapConsoleTransport,
  transportOptions: {
    mapLevels: {
      debug: 'log',
      info: 'info',
      warn: 'warn',
      error: 'error',
    },
  },
};

const log = logger.createLogger(config);

export default log;
