import * as FileSystem from 'expo-file-system';
import {fileAsyncTransport, logger, mapConsoleTransport, transportFunctionType} from 'react-native-logs';
import {toISOStringUTC} from 'utils/date';
import {z} from 'zod';

// react-native-logs always logs to FS.documentDirectory
const LOG_PATH = 'log.txt';
export const logFilePath = FileSystem.documentDirectory + LOG_PATH;

// Always delete the log file on startup
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await FileSystem.deleteAsync(logFilePath, {idempotent: true});
  })();
}

const rawMsgSchema = z
  .tuple([
    z.string(), // the message
    z.record(z.string(), z.any()), // context values
  ])
  .or(
    z.tuple([
      z.string(), // the message
    ]),
  );
type rawMsg = z.infer<typeof rawMsgSchema>;

const customTransport: transportFunctionType = props => {
  const parseResult = rawMsgSchema.safeParse(props.rawMsg);
  let msg: rawMsg = null;
  if (parseResult.success === false) {
    throw parseResult.error;
  } else {
    msg = parseResult.data;
  }

  let mappedMsg: Record<string, string> = {
    msg: msg[0],
  };
  if (msg.length === 2) {
    mappedMsg = {...mappedMsg, ...(msg[1] as Record<string, string>)};
  }
  props.msg = JSON.stringify({timestamp: toISOStringUTC(new Date()), level: props.level.text, ...mappedMsg});
  const delegates = process.env.NODE_ENV !== 'test' ? [fileAsyncTransport, mapConsoleTransport] : [mapConsoleTransport]; // filesystem isn't available in test
  for (const delegate of delegates) {
    delegate(props);
  }
};

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  transport: [customTransport],
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

const log = logger.createLogger<'debug' | 'info' | 'warn' | 'error'>(config);

export default log;
