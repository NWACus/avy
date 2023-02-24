import React from 'react';

import axios from 'axios';

import {ClientContext, ClientProps} from 'clientContext';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useFetch = <TData, TVariables>(query: string, options?: RequestInit['headers']): ((variables?: TVariables) => Promise<TData>) => {
  const clientProps = React.useContext<ClientProps>(ClientContext);
  // TODO(skuznets): how to support options?
  return async (variables?: TVariables) => {
    const url = `${clientProps.nationalAvalancheCenterHost}/obs/v1/public/graphql`;
    const {data} = await axios.post(url, {
      query: query,
      variables: variables,
    });

    return data.data;
  };
};
