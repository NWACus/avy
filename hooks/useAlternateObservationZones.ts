import {useQuery, UseQueryResult} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useContext} from 'react';
import {xml2json} from 'xml-js';

interface KMLPoint {
  coordinates: string;
}

interface KMLPlacemark {
  name: string;
  description?: string;
  Point?: KMLPoint;
  LineString?: {
    coordinates: string;
  };
  Polygon?: {
    outerBoundaryIs: {
      LinearRing: {
        coordinates: string;
      };
    };
  };
}

interface KMLDocument {
  name: string;
  Folder: {
    Placemark: KMLPlacemark[];
  };
}

interface KMLData {
  kml: {
    Document: KMLDocument;
  };
}

export const useAlternateObservationZones = (url?: string): UseQueryResult<KMLData | null, AxiosError> => {
  const {logger} = useContext<LoggerProps>(LoggerContext);
  const key = ['alternateObservationZones', url];
  const thisLogger = logger.child({query: key});

  return useQuery<KMLData | null, AxiosError>({
    queryKey: key,
    queryFn: (): Promise<KMLData | null> => fetchAlternateObservationZones(url, thisLogger),
    enabled: !!url,
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    initialData: null, // return null if no URL is provided
  });
};

export const fetchAlternateObservationZones = async (url: string, logger: Logger): Promise<KMLData | null> => {
  if (!url) {
    return null;
  }
  const thisLogger = logger.child({url: url});
  thisLogger.debug('Fetching alternate observation zones');
  const response = await safeFetch(() => axios.get<string>(url), thisLogger, 'alternate observation zones');
  const kmlDataJson = xml2json(response, {compact: true, spaces: 2});
  const kmlData = JSON.parse(kmlDataJson) as KMLData;
  const placemarks = kmlData.kml.Document.Folder.Placemark.map(placemark => {
    const placeName = placemark.name._text;
    const coordinates =
      placemark.Polygon?.outerBoundaryIs.LinearRing.coordinates._text
        .trim()
        .split('\n')
        .map(coord => {
          const [longitude, latitude] = coord.split(',').map(Number);
          return [longitude, latitude];
        }) || [];
    return {properties: {name: placeName}, geometry: {type: 'Polygon', coordinates}};
  });
  return placemarks;
};
