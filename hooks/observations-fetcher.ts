import React from 'react';

import axios from 'axios';

import {ClientContext, ClientProps} from '../clientContext';

export const fetch = <TData, TVariables>(query: string, options?: RequestInit['headers']): ((variables?: TVariables) => Promise<TData>) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  return async (variables?: TVariables) => {
    const url = `${clientProps.nationalAvalancheCenterHost}/obs/v1/public/graphql`;
    const {data} = await axios.post(url, {
      query: query,
      variables: variables,
    });

    return data.data;
  };
};
