import * as Sentry from '@sentry/react-native';
import {QueryClient, UseQueryResult, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';
import {Logger} from 'browser-bunyan';
import {formatDistanceToNowStrict} from 'date-fns';
import {XMLParser} from 'fast-xml-parser';
import {safeFetch} from 'hooks/fetch';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useContext, useMemo} from 'react';
import {
  AvalancheCenterID,
  KMLFeature,
  KMLFeatureCollection,
  KMLFileSchema,
  KMLPlacemark,
  MapLayerFeature,
  MapLayerOrObservationZonesFeature,
  MergedMapLayer,
  ObservationZonesFeature,
  ObservationZonesFeatureCollection,
  observationZonesPropertiesSchema,
} from 'types/nationalAvalancheCenter';

export function useMergedMapLayer(center_id: AvalancheCenterID, mapLayer: MergedMapLayer | undefined): MergedMapLayer | undefined {
  const avalancheZoneMetadataResult = useAvalancheCenterMetadata(center_id);
  const alternateZonesUrl: string = avalancheZoneMetadataResult.data?.widget_config?.observation_viewer?.alternate_zones || '';
  const alternateObservationZonesResult = useAlternateObservationZones(alternateZonesUrl, center_id);

  const observationOnlyZones = alternateObservationZonesResult.data;

  const mergedMapLayer = useMemo((): MergedMapLayer | undefined => {
    if (!mapLayer || !observationOnlyZones?.features?.length) {
      return mapLayer;
    }

    const zonesNotInMapLayer: ObservationZonesFeature[] = observationOnlyZones.features.filter(
      (zone: ObservationZonesFeature) => !(mapLayer.features as MapLayerFeature[]).some((mapFeature: MapLayerFeature) => mapFeature.properties.name === zone.properties.name),
    );

    if (zonesNotInMapLayer.length > 0) {
      const combinedFeatures: MapLayerOrObservationZonesFeature[] = [...mapLayer.features, ...zonesNotInMapLayer];
      return {
        ...mapLayer,
        features: combinedFeatures,
      };
    }

    return mapLayer;
  }, [observationOnlyZones, mapLayer]);

  return mergedMapLayer;
}

export const useAlternateObservationZones = (url: string, center_id: AvalancheCenterID): UseQueryResult<ObservationZonesFeatureCollection, AxiosError> => {
  const {logger} = useContext<LoggerProps>(LoggerContext);
  const key = queryKey(url);
  const thisLogger: Logger = logger.child({query: key});

  return useQuery<ObservationZonesFeatureCollection, AxiosError>({
    queryKey: key,
    queryFn: (): Promise<ObservationZonesFeatureCollection> => fetchAlternateObservationZones(thisLogger, url, center_id),
    enabled: !!url,
    cacheTime: Infinity,
    initialData: {type: 'FeatureCollection', features: []},
  });
};

export const prefetchAlternateObservationZones = async (queryClient: QueryClient, url: string, center_id: AvalancheCenterID, logger: Logger) => {
  const key = queryKey(url);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating prefetch');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<ObservationZonesFeatureCollection> => {
      const start = new Date();
      logger.trace(`prefetching`);
      const result = await fetchAlternateObservationZones(logger, url, center_id);
      thisLogger.trace({duration: formatDistanceToNowStrict(start)}, `finished prefetching`);
      return result;
    },
    cacheTime: Infinity, // hold this in the query cache forever
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

export const fetchAlternateObservationZones = async (logger: Logger, url: string, center_id: AvalancheCenterID): Promise<ObservationZonesFeatureCollection> => {
  logger.debug('Fetching alternate observation zones');
  const response = await safeFetch(() => axios.get<string>(url), logger, 'alternate observation zones');
  try {
    const kmlFeatureCollection = parseKmlData(response, logger, url);
    const observationZones = transformKmlFeaturesToObservationZones(kmlFeatureCollection, center_id, logger);
    logger.debug('Fetched alternate observation zones');
    return observationZones;
  } catch (error) {
    logger.error({error: error}, 'Error parsing KML data');
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }
};

export function queryKey(url: string) {
  return ['alternateZoneKML', {url: url}];
}

export function wrapTextFields(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(wrapTextFields);
  } else if (typeof data === 'object' && data !== null) {
    const newData: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      const value = (data as Record<string, unknown>)[key];
      if ((key === 'coordinates' || key === 'name') && typeof value === 'string') {
        newData[key] = {_text: value};
      } else {
        newData[key] = wrapTextFields(value);
      }
    }
    return newData;
  }
  return data;
}

export function parseKmlData(response: string, logger: Logger, url: string): KMLFeatureCollection {
  const parser = new XMLParser();
  const kmlResponse = wrapTextFields(parser.parse(response));
  const parseResult = KMLFileSchema.safeParse(kmlResponse);

  if (!parseResult.success) {
    logger.error(`Invalid KML file: ${JSON.stringify(parseResult.error.format())}`);
    Sentry.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        url,
      },
    });
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const kmlData = parseResult.data;

  const placemarks: KMLPlacemark[] = kmlData.kml.Document.Folder.Placemark;
  const features: KMLFeature[] = placemarks.map((placemark, index) => {
    const coordinateString = getCoordinateString(placemark);
    const coordinates = parseCoordinates(coordinateString);
    const feature: KMLFeature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      id: index,
      properties: {
        name: placemark.name._text || 'Unknown KML Zone',
      },
    };
    return feature;
  });
  const kmlFeatureCollection: KMLFeatureCollection = {
    type: 'FeatureCollection',
    features: features,
  };
  return kmlFeatureCollection;
}

export function getCoordinateString(placemark: KMLPlacemark): string {
  if (placemark.Polygon) {
    return placemark.Polygon.outerBoundaryIs.LinearRing.coordinates._text;
  } else if (placemark.MultiGeometry) {
    return placemark.MultiGeometry.Polygon.outerBoundaryIs.LinearRing.coordinates._text;
  }
  return '';
}

export function parseCoordinates(coordinateString: string): number[][] {
  if (!coordinateString || !coordinateString.trim()) {
    return [];
  }
  const coordinateStringArray = coordinateString.trim().split(/\s+/);
  return coordinateStringArray.map(coord => {
    const [longitude, latitude] = coord.split(',');
    return [parseFloat(longitude), parseFloat(latitude)];
  });
}

export function transformKmlFeaturesToObservationZones(kmlCollection: KMLFeatureCollection, center_id: AvalancheCenterID, logger: Logger): ObservationZonesFeatureCollection {
  function isObservationZoneFeature(feature: ObservationZonesFeature | undefined): feature is ObservationZonesFeature {
    return feature !== undefined;
  }

  const transformedFeatures: (ObservationZonesFeature | undefined)[] = kmlCollection.features.map((feature, i) => {
    const baseProperties = {
      name: feature.properties.name,
      center_id: center_id,
    };

    const propertiesParseResult = observationZonesPropertiesSchema.safeParse(baseProperties);
    if (!propertiesParseResult.success) {
      logger.error(`Invalid properties for feature ${i}: ${JSON.stringify(propertiesParseResult.error.format())}`);
      return undefined;
    }
    const fullProperties = propertiesParseResult.data;
    const numericId = -100000 - i;
    const transformedFeature: ObservationZonesFeature = {
      type: 'Feature',
      geometry: feature.geometry,
      id: numericId,
      properties: fullProperties,
    };

    return transformedFeature;
  });

  const observationZones = transformedFeatures.filter(isObservationZoneFeature);
  return {
    type: 'FeatureCollection',
    features: observationZones,
  };
}

export default {
  queryKey,
  prefetch: prefetchAlternateObservationZones,
};
