import {Logger, createLogger, stdSerializers} from 'browser-bunyan';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
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

let theLogger: Logger | undefined = undefined;

// Get the singleton logger for the app. Will create the object if it doesn't exist.
export const getLogger = (): Logger => {
  if (!theLogger) {
    theLogger = createLogger({
      name: 'avy',
      serializers: stdSerializers,
      streams: [
        {
          level: (Constants.expoConfig?.extra?.log_level as string) ?? 'INFO',
          stream: new ConsoleFormattedStream(),
        },
        {
          level: 'DEBUG',
          stream: new FileStream(logFilePath),
        },
      ],
    });
  }
  return theLogger;
};
