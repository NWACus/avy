import React, {Context} from 'react';

export interface ClientProps {
  nationalAvalancheCenterHost: string;
  snowboundHost: string;
}

export const defaultClientProps: ClientProps = {
  nationalAvalancheCenterHost: 'https://api.avalanche.org',
  snowboundHost: 'https://api.snowobs.com',
};
export const ClientContext: Context<ClientProps> = React.createContext<ClientProps>(defaultClientProps);
