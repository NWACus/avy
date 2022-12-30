import React, {Context} from 'react';

export interface ClientProps {
  setAvalancheCenter: (center: string) => void;
  nationalAvalancheCenterHost: string;
  snowboundHost: string;
  staging: boolean;
  toggleStaging: () => void;
}

export const productionHosts = {
  nationalAvalancheCenterHost: 'https://api.avalanche.org',
  snowboundHost: 'https://api.snowobs.com',
};

export const stagingHosts = {
  nationalAvalancheCenterHost: 'https://staging-api.avalanche.org',
  // TODO(brian): what's the Staging version for Snowbound?
  snowboundHost: 'https://api.snowobs.com',
};

export const contextDefaults = {
  ...productionHosts,
  staging: false,
};

export const ClientContext: Context<ClientProps> = React.createContext<ClientProps>({
  ...contextDefaults,
  setAvalancheCenter: () => undefined,
  toggleStaging: () => undefined,
});
