import {Logger} from 'browser-bunyan';
import {getLogger} from 'logger';
import React, {Context} from 'react';

export interface LoggerProps {
  logger: Logger;
}

export const LoggerContext: Context<LoggerProps> = React.createContext<LoggerProps>({
  logger: getLogger(),
});
