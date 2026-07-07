import {StreamOptions, createLogger, stdSerializers} from 'browser-bunyan';
import Constants from 'expo-constants';
import {File, Paths} from 'expo-file-system';
import * as Updates from 'expo-updates';
import {ConsoleFormattedStream} from 'logging/consoleFormattedStream';
import {FileStream} from 'logging/fileStream';
import {LogBox, Platform} from 'react-native';

// react-native-logs always logs to FS.documentDirectory
const LOG_PATH = 'log.json';

// expo-file-system is not supported on web, and accessing Paths.document throws
// there, so skip file-based logging entirely on the web preview.
const fileLoggingSupported = Platform.OS !== 'web';

// Path's export is undefined in the Jest testing environment
export const logFilePath = (fileLoggingSupported ? Paths?.document?.uri ?? '' : '') + LOG_PATH;

// Always delete the log file on startup
if (fileLoggingSupported && process.env.NODE_ENV !== 'test') {
  const logFile = new File(logFilePath);
  if (logFile.exists) {
    logFile.delete();
  }
}

if (process.env.EXPO_PUBLIC_DISABLE_LOGBOX) {
  LogBox?.ignoreAllLogs(true);
}

const defaultLogLevel = process.env.NODE_ENV !== 'test' ? 'WARN' : 'INFO';

const streams: StreamOptions[] = [];

// In development mode, log to the console
if (Updates.channel === '') {
  streams.push({
    level: (Constants.expoConfig?.extra?.log_level as string) ?? defaultLogLevel,
    stream: new ConsoleFormattedStream(),
  });
}

// Always log to file, except for when we're in test
if (fileLoggingSupported && process.env.NODE_ENV !== 'test') {
  streams.push({
    level: 'INFO',
    stream: new FileStream(logFilePath),
  });
}

export const logger = createLogger({
  name: 'avy',
  serializers: stdSerializers,
  streams,
});
