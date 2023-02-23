import React, {Context} from 'react';

export interface ClientProps {
  nationalAvalancheCenterHost: string;
  observationsUrlPrefix: string;
  snowboundHost: string;
  nwacHost: string;
}

export const productionHosts = {
  nationalAvalancheCenterHost: 'https://api.avalanche.org',
  observationsUrlPrefix: 'https://staging-api.avalanche.org',
  snowboundHost: 'https://api.snowobs.com',
  nwacHost: 'https://nwac.us',
};

export const stagingHosts = {
  nationalAvalancheCenterHost: 'https://staging-api.avalanche.org',
  observationsUrlPrefix: 'https://staging-api.avalanche.org',
  // TODO(brian): what's the Staging version for Snowbound?
  snowboundHost: 'https://api.snowobs.com',
  nwacHost: 'https://staging.nwac.us',
};

export const ClientContext: Context<ClientProps> = React.createContext<ClientProps>({
  ...productionHosts,
});
