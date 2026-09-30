import React from 'react';

import {useQueries, useQueryClient, UseQueryOptions} from '@tanstack/react-query';
import {AxiosError} from 'axios';

import {ClientContext, ClientProps} from 'clientContext';
import {filterToNACCenters} from 'components/avalancheCenterList';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import {useNACApiVersion} from 'hooks/useNACApiVersion';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AllAvalancheCenterCapabilities, AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAllAvalancheCenterMetadata = (capabilities: AllAvalancheCenterCapabilities | undefined) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const apiVersion = useNACApiVersion();
  const queryClient = useQueryClient();

  const knownCenters: AvalancheCenterID[] = [];
  if (capabilities) {
    knownCenters.push(...filterToNACCenters(capabilities.centers.map(center => center.id)));
  }

  return useQueries<UseQueryOptions<AvalancheCenter, AxiosError | ZodError>[]>({
    queries: knownCenters.map(center => {
      return {
        queryKey: AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, apiVersion, center),
        queryFn: async (): Promise<AvalancheCenter> => AvalancheCenterMetadataQuery.fetchQuery(queryClient, nationalAvalancheCenterHost, apiVersion, center, logger),
        enabled: !!capabilities,
        cacheTime: Infinity, // hold on to this cached data forever
      };
    }),
  });
};
