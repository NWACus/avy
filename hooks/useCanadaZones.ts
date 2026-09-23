import React, {useEffect, useMemo} from 'react';

import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useCanadaForecastMetadata} from 'hooks/useCanadaForecastMetadata';
import {useCanadaMapLayer} from 'hooks/useCanadaMapLayer';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {CanadaMapViewZone, canadaMapViewZonesFor, CENTERS_OVERLAPPED_BY_AVALANCHE_CANADA} from 'utils/canadaMapViewZone';
import {RequestedTime} from 'utils/date';

export const useCanadaZones = (requestedTime: RequestedTime): CanadaMapViewZone[] => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const {data: areas, error: areasError} = useCanadaMapLayer(requestedTime);
  const {data: metadata, error: metadataError} = useCanadaForecastMetadata(requestedTime);
  const {data: allMapLayers} = useAllMapLayers(requestedTime);

  useEffect(() => {
    if (areasError || metadataError) {
      logger.warn({areasError: areasError, metadataError: metadataError}, 'avalanche canada zones unavailable');
    }
  }, [logger, areasError, metadataError]);

  const overlappingZones = useMemo(
    () => allMapLayers?.features.filter(feature => CENTERS_OVERLAPPED_BY_AVALANCHE_CANADA.includes(feature.properties.center_id)) ?? [],
    [allMapLayers],
  );

  return useMemo(() => canadaMapViewZonesFor(areas, metadata, overlappingZones, logger), [areas, metadata, overlappingZones, logger]);
};
