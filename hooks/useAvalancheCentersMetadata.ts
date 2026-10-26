import React from 'react';

import {useQueries, useQueryClient, UseQueryOptions} from '@tanstack/react-query';
import {AxiosError} from 'axios';

import {ClientContext, ClientProps} from 'clientContext';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import {useNACApiVersion} from 'hooks/useNACApiVersion';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAvalancheCentersMetadata = (centerIds: AvalancheCenterID[]) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const apiVersion = useNACApiVersion();
  const queryClient = useQueryClient();

  return useQueries<UseQueryOptions<AvalancheCenter, AxiosError | ZodError>[]>({
    queries: centerIds.map(center => ({
      queryKey: AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, apiVersion, center),
      queryFn: async (): Promise<AvalancheCenter> => AvalancheCenterMetadataQuery.fetchQuery(queryClient, nationalAvalancheCenterHost, apiVersion, center, logger),
      cacheTime: Infinity,
    })),
  });
};
