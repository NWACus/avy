import React from 'react';

import {useQueries, useQueryClient, UseQueryOptions} from '@tanstack/react-query';
import {AxiosError} from 'axios';

import {ClientContext, ClientProps} from 'clientContext';
import {AvalancheCenters, filterToKnownCenters, filterToSupportedCenters} from 'components/avalancheCenterList';
import AvalancheCenterMetadataQuery from 'hooks/useAvalancheCenterMetadata';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {AllAvalancheCenterCapabilities, AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {ZodError} from 'zod';

export const useAllAvalancheCenterMetadata = (capabilities: AllAvalancheCenterCapabilities | undefined, whichCenters: AvalancheCenters) => {
  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const queryClient = useQueryClient();

  const knownCenters: AvalancheCenterID[] = [];
  if (capabilities) {
    knownCenters.push(...filterToKnownCenters(capabilities.centers.map(center => center.id)));
  }

  const filteredCenters: AvalancheCenterID[] = [];
  switch (whichCenters) {
    case AvalancheCenters.AllCenters:
      filteredCenters.push(...knownCenters);
      break;
    case AvalancheCenters.SupportedCenters:
      filteredCenters.push(...filterToSupportedCenters(knownCenters));
  }

  return useQueries<UseQueryOptions<AvalancheCenter, AxiosError | ZodError>[]>({
    queries: filteredCenters
      ? filteredCenters.map(center => {
          return {
            queryKey: AvalancheCenterMetadataQuery.queryKey(nationalAvalancheCenterHost, center),
            queryFn: async (): Promise<AvalancheCenter> => AvalancheCenterMetadataQuery.fetchQuery(queryClient, nationalAvalancheCenterHost, center, logger),
            enabled: !!capabilities,
            cacheTime: Infinity, // hold on to this cached data forever
          };
        })
      : [],
  });
};
