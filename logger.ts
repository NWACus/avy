import {StreamOptions, createLogger, stdSerializers} from 'browser-bunyan';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Updates from 'expo-updates';
import {ConsoleFormattedStream} from 'logging/consoleFormattedStream';
import {FileStream} from 'logging/fileStream';
import {LogBox} from 'react-native';

// react-native-logs always logs to FS.documentDirectory
const LOG_PATH = 'log.json';
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

const streams: StreamOptions[] = [
  {
    level: (Constants.expoConfig?.extra?.log_level as string) ?? 'INFO',
    stream: new ConsoleFormattedStream(),
  },
];

// Log to file in preview and development channels
if (Updates.channel !== 'release') {
  streams.push({
    level: 'DEBUG',
    stream: new FileStream(logFilePath),
  });
}

export const logger = createLogger({
  name: 'avy',
  serializers: stdSerializers,
  streams,
});

// Sometimes we're sending very large data params like base64-encoded images.
// Let's not log those, eh?
export const filterBigStrings = (params: unknown): unknown => {
  if (!params || (typeof params !== 'object' && typeof params !== 'string')) {
    return params;
  }

  if (typeof params === 'string') {
    return params.length > 100 ? params.substring(0, 100) + '...' : params;
  }

  if (Array.isArray(params)) {
    return params.map(filterBigStrings);
  }

  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, filterBigStrings(v)]));
};
