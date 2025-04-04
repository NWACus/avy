import {QueryClient, UseQueryResult, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';
import {Logger} from 'browser-bunyan';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useContext} from 'react';
import {AlternateObservationZones, KMLData, KMLPlacemark} from 'types/nationalAvalancheCenter';
import {xml2json} from 'xml-js';

export const useAlternateObservationZones = (url: string): UseQueryResult<AlternateObservationZones, AxiosError> => {
  const {logger} = useContext<LoggerProps>(LoggerContext);
  const key = queryKey(url);
  const thisLogger = logger.child({query: key});

  return useQuery<AlternateObservationZones, AxiosError>({
    queryKey: key,
    queryFn: (): Promise<AlternateObservationZones> => fetchAlternateObservationZones(thisLogger, url),
    enabled: !!url,
    cacheTime: 60, // TODO: Change cache to one day after testing
    staleTime: 60,
    initialData: [],
  });
};

export const prefetchAlternateObservationZones = async (queryClient: QueryClient, url: string, logger: Logger) => {
  const key = queryKey(url);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('prefetching alternate observation zones');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async (): Promise<AlternateObservationZones> => {
      thisLogger.trace(`prefetching`);
      const result = fetchAlternateObservationZones(thisLogger, url);
      return result;
    },
    cacheTime: 60, // TODO: Change cache to one day after testing
    staleTime: 60,
  });
};

export const fetchAlternateObservationZones = async (logger: LoggerProps['logger'], url: string): Promise<AlternateObservationZones> => {
  const thisLogger = logger.child({url: url});
  thisLogger.debug('Fetching alternate observation zones');
  const response = await safeFetch(() => axios.get<string>(url), thisLogger, 'alternate observation zones');
  try {
    const alternateZones = parseKmlData(response);
    thisLogger.debug('Fetched alternate observation zones');
    return alternateZones;
  } catch (error) {
    thisLogger.error({error: error}, 'Error parsing KML data');
    throw new Error('Error parsing KML data');
  }
};

function queryKey(url: string) {
  return ['alternateZoneKML-', url];
}

export function parseKmlData(response: string): AlternateObservationZones {
  const kmlDataJson = xml2json(response, {compact: true, spaces: 2});
  const kmlData = JSON.parse(kmlDataJson) as KMLData;
  const placemarks = kmlData.kml.Document.Folder.Placemark;
  const alternateZones: AlternateObservationZones = (Array.isArray(placemarks) ? placemarks : [placemarks]).map(placemark => {
    let coordinates: number[][] = [];

    const coordinateString = getCoordinateString(placemark);
    coordinates = parseCoordinates(coordinateString);
    const feature: AlternateObservationZones = {
      type: 'Feature',
      geometry: {
        type: Array.isArray(coordinates[0][0]) ? 'MultiPolygon' : 'Polygon',
        coordinates: Array.isArray(coordinates[0][0]) ? coordinates : [coordinates],
      },
      properties: {
        name: placemark.name?._text || 'Unnamed Zone',
      },
    };
    return feature;
  });
  return alternateZones;
}

export function getCoordinateString(placemark: KMLPlacemark): string {
  let coordinateString;
  if (placemark.Polygon) {
    coordinateString = placemark.Polygon.outerBoundaryIs.LinearRing.coordinates;
  } else if (placemark.MultiGeometry) {
    coordinateString = placemark.MultiGeometry.Polygon.outerBoundaryIs.LinearRing.coordinates;
  }
  // xml2Json makes coordinates an object with the coordinates in property _text
  return typeof coordinateString === 'string' ? coordinateString : coordinateString._text;
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
