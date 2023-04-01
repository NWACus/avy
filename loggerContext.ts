import {createLogger, Logger, stdSerializers} from 'browser-bunyan';
import React, {Context} from 'react';

export interface LoggerProps {
  logger: Logger;
}

export const LoggerContext: Context<LoggerProps> = React.createContext<LoggerProps>({
  logger: createLogger({
    name: 'avalanche-forecast',
    serializers: stdSerializers,
  }),
});
