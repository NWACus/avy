/* eslint-disable no-console */
export class ConsoleFormattedStream {
  write(record: object): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const {levelName, time, msg, v: _, hostname: __, pid: ___, src: _____, level: ______, name: _______, ...context} = record;
    let formatString = '%c[%s] %c%s %c%s';
    for (let i = 0; i < Object.keys(context).length; i++) {
      formatString += ' %c%s: %c%s';
    }

    let levelColor = 'Grey';
    let consoleMethod = console.log;
    switch (levelName) {
      case 'trace':
        levelColor = 'Grey';
        consoleMethod = console.info;
        break;
      case 'debug':
        levelColor = 'Blue';
        consoleMethod = console.info;
        break;
      case 'info':
        levelColor = 'White';
        consoleMethod = console.info;
        break;
      case 'warn':
        levelColor = 'Orange';
        consoleMethod = console.warn;
        break;
      case 'error':
        levelColor = 'Red';
        consoleMethod = console.error;
        break;
      case 'fatal':
        levelColor = 'Brown';
        consoleMethod = console.error;
        break;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const args = ['color: Grey', time, `color: ${levelColor}`, levelName.toUpperCase(), 'color: White', msg];
    args.push(
      ...Object.entries(context)
        .sort((a, b): number => {
          return a[0].localeCompare(b[0]);
        })
        .map(([key, value]) => ['color: Grey', key, 'color: LightGrey', JSON.stringify(value)])
        .flat(),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    consoleMethod(formatString, ...args);
  }
}
