import {LogStream} from 'browser-bunyan';
import * as FileSystem from 'expo-file-system';
import {debounce} from 'lodash';
import {filterLoggedData} from 'logging/filterLoggedData';
import * as Sentry from 'sentry-expo';

export class FileStream implements LogStream {
  private readonly filePath: string;
  private buffer: string[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.buffer = [];
    void FileSystem.writeAsStringAsync(this.filePath, '');
  }

  private FLUSH_INTERVAL_MS = 1000;

  // Flush the buffer to disk, but only once per second
  // Yes, there's no way to append to a file in a managed Expo app :(
  private flush = debounce(async (): Promise<void> => {
    const buffer = this.buffer;
    this.buffer = [];
    const contents = await FileSystem.readAsStringAsync(this.filePath);
    try {
      return await FileSystem.writeAsStringAsync(this.filePath, contents + buffer.join('\n') + '\n');
    } catch (error) {
      Sentry.Native.captureException(error, {
        extra: {
          message: 'Unexpected error flushing log',
        },
        tags: {
          file_system_error: true,
          path: this.filePath,
        },
      });
    }
  }, this.FLUSH_INTERVAL_MS);

  write(record: object): void {
    const recordString = JSON.stringify({
      // the bunyan command line tool can't format these records correctly without a pid and hostname field
      pid: 0,
      hostname: 'localhost',
      // filterLoggedData will take anything and return the same type
      ...(filterLoggedData(record) as object),
    });
    this.buffer.push(recordString);
    void this.flush();
  }
}
