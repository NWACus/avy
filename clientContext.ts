import React, {Context} from 'react';

export interface ClientProps {
  host: string;
}

export const defaultClientProps: ClientProps = {host: 'https://api.avalanche.org'};
export const ClientContext: Context<ClientProps> = React.createContext<ClientProps>(defaultClientProps);
