import React, {Context} from 'react';

export interface ClientProps {
  nationalAvalancheCenterHost: string;
  snowboundHost: string;
  staging: boolean;
  toggleStaging: () => void;
}

export const productionClientProps = {
  nationalAvalancheCenterHost: 'https://api.avalanche.org',
  snowboundHost: 'https://api.snowobs.com',
};

export const stagingClientProps = {
  nationalAvalancheCenterHost: 'https://staging-api.avalanche.org',
  // TODO(brian): what's the Staging version for Snowbound?
  snowboundHost: 'https://api.snowobs.com',
};

export const ClientContext: Context<ClientProps> = React.createContext<ClientProps>({
  ...productionClientProps,
  staging: false,
  toggleStaging: () => undefined,
});
