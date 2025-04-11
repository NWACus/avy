import {QueryClient, UseQueryResult, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';
import {Logger} from 'browser-bunyan';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useContext} from 'react';
import {
  AvalancheCenterID,
  KMLFeature,
  KMLFeatureCollection,
  KMLFileSchema,
  KMLPlacemark,
  ObservationZonesFeature,
  ObservationZonesFeatureCollection,
  observationZonesPropertiesSchema,
} from 'types/nationalAvalancheCenter';
import {xml2json} from 'xml-js';

export const useAlternateObservationZones = (url: string, center_id: AvalancheCenterID): UseQueryResult<ObservationZonesFeatureCollection, AxiosError> => {
  const {logger} = useContext<LoggerProps>(LoggerContext);
  const key = queryKey(url);
  const thisLogger: Logger = logger.child({query: key});

  return useQuery<ObservationZonesFeatureCollection, AxiosError>({
    queryKey: key,
    queryFn: (): Promise<ObservationZonesFeatureCollection> => fetchAlternateObservationZones(thisLogger, url, center_id),
    enabled: !!url,
    cacheTime: 60, // TODO: Change cache to one day after testing
    staleTime: 60,
    initialData: {type: 'FeatureCollection', features: []},
  });
};

// Todo: Implement this prefetch
export const prefetchAlternateObservationZones = async (queryClient: QueryClient, url: string, center_id: AvalancheCenterID, logger: Logger) => {
  const key = queryKey(url);
  logger.debug('prefetching alternate observation zones');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<ObservationZonesFeatureCollection> => {
      logger.trace(`prefetching`);
      const result = fetchAlternateObservationZones(logger, url, center_id);
      return result;
    },
    cacheTime: 60, // TODO: Change cache to one day after testing
    staleTime: 60,
  });
};

export const fetchAlternateObservationZones = async (logger: Logger, url: string, center_id: AvalancheCenterID): Promise<ObservationZonesFeatureCollection> => {
  logger.debug('Fetching alternate observation zones');
  const response = await safeFetch(() => axios.get<string>(url), logger, 'alternate observation zones');
  try {
    const kmlFeatureCollection = parseKmlData(response, logger);
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

function queryKey(url: string) {
  return ['alternateZoneKML-', url];
}

export function parseKmlData(response: string, logger: Logger): KMLFeatureCollection {
  const kmlResponse = xml2json(response, {compact: true, spaces: 2});
  const kmlFile = KMLFileSchema.safeParse(JSON.parse(kmlResponse));

  if (!kmlFile.success) {
    logger.error(`Invalid KML file: ${JSON.stringify(kmlFile.error.format())}`);
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  const kmlData = kmlFile.data;

  const placemarks: KMLPlacemark[] = kmlData.kml.Document.Folder.Placemark;
  const features: KMLFeature[] = placemarks.map(placemark => {
    const coordinateString = getCoordinateString(placemark);
    const coordinates = parseCoordinates(coordinateString);
    const feature: KMLFeature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      id: Math.floor(Math.random() * 9000000) + 1000000, //Todo: replace with a better id generation method

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
