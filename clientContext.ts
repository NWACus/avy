import React, {Context} from 'react';

export interface ClientProps {
  nationalAvalancheCenterHost: string;
  snowboundHost: string;
}

export const productionClientProps: ClientProps = {
  nationalAvalancheCenterHost: 'https://api.avalanche.org',
  snowboundHost: 'https://api.snowobs.com',
};

export const stagingClientProps: ClientProps = {
  nationalAvalancheCenterHost: 'https://staging-api.avalanche.org',
  // TODO(brian): what's the Staging version for Snowbound?
  snowboundHost: 'https://api.snowobs.com',
};

export const ClientContext: Context<ClientProps> = React.createContext<ClientProps>(stagingClientProps);
