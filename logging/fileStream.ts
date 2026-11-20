import * as Sentry from '@sentry/react-native';
import {LogStream} from 'browser-bunyan';
import {File} from 'expo-file-system';
import {debounce} from 'lodash';
import {filterLoggedData} from 'logging/filterLoggedData';

export class FileStream implements LogStream {
  private readonly filePath: string;
  private buffer: string[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.buffer = [];
    new File(this.filePath).writeSync('');
  }

  private FLUSH_INTERVAL_MS = 1000;

  // Flush the buffer to disk, but only once per second
  private flush = debounce(async (): Promise<void> => {
    const buffer = this.buffer;
    this.buffer = [];
    try {
      await new File(this.filePath).write(buffer.join('\n') + '\n', {append: true});
    } catch (error) {
      Sentry.captureException(error, {
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
