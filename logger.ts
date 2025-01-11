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
if (process.env.NODE_ENV !== 'test') {
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
