import React, {Context} from 'react';
import {RequestedTime} from 'utils/date';

export interface ClientProps {
  nationalAvalancheCenterHost: string;
  nationalAvalancheCenterWordpressHost: string;
  snowboundHost: string;
  nwacHost: string;
  requestedTime: RequestedTime;
  setRequestedTime: (requestedTime: RequestedTime) => void;
}

export const productionHosts = {
  nationalAvalancheCenterHost: 'https://api.avalanche.org',
  nationalAvalancheCenterWordpressHost: 'https://forecasts.avalanche.org',
  snowboundHost: 'https://api.snowobs.com',
  nwacHost: 'https://nwac.us',
};

export const stagingHosts = {
  nationalAvalancheCenterHost: 'https://staging-api.avalanche.org',
  nationalAvalancheCenterWordpressHost: 'https://devavycenters.wpengine.com',
  snowboundHost: 'https://dev.snowobs.com',
  nwacHost: 'https://staging.nwac.us',
};

export const ClientContext: Context<ClientProps> = React.createContext<ClientProps>({
  ...productionHosts,
  requestedTime: 'latest',
  setRequestedTime: () => {},
});
