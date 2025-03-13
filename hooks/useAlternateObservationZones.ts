import {UseQueryResult, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useContext} from 'react';
import {AlternateObservationZones, KMLData} from 'types/nationalAvalancheCenter';
import {xml2json} from 'xml-js';

export const useAlternateObservationZones = (url?: string): UseQueryResult<AlternateObservationZones[] | null, AxiosError> => {
  const {logger} = useContext<LoggerProps>(LoggerContext);
  const key = ['alternateObservationZone-', url];
  const thisLogger = logger.child({query: key});

  return useQuery<AlternateObservationZones[] | null, AxiosError>({
    queryKey: key,
    queryFn: (): Promise<AlternateObservationZones[] | null> => fetchAlternateObservationZones(thisLogger, url),
    enabled: !!url,
    cacheTime: 60, // TODO: Change cache to one day after testing
    staleTime: 60,
    initialData: null,
  });
};

export const fetchAlternateObservationZones = async (logger: LoggerProps['logger'], url?: string): Promise<AlternateObservationZones[] | null> => {
  if (!url) {
    return null;
  }
  const thisLogger = logger.child({url: url});
  thisLogger.debug('Fetching alternate observation zones');
  const response = await safeFetch(() => axios.get<string>(url), thisLogger, 'alternate observation zones');
  const kmlDataJson = xml2json(response, {compact: true, spaces: 2});
  if (!response) {
    thisLogger.error('No response received from safeFetch');
    return null;
  }

  const kmlData = JSON.parse(kmlDataJson) as KMLData;
  if (!kmlData || !kmlData.kml || !kmlData.kml.Document || !kmlData.kml.Document.Folder || !kmlData.kml.Document.Folder.Placemark) {
    thisLogger.error('Invalid KML data structure');
    return null;
  }

  const alternateZones: AlternateObservationZones[] = kmlData.kml.Document.Folder.Placemark.map(placemark => {
    let coordinates: number[][] = [];
    const parseCoordinates = (coordinateString: string): number[][] => {
      const coordinateStringArray = coordinateString.trim().split(/\s+/);
      return coordinateStringArray.map(coord => {
        const [longitude, latitude] = coord.split(',');
        return [parseFloat(longitude), parseFloat(latitude)];
      });
    };

    if (placemark.Polygon) {
      coordinates = parseCoordinates(placemark.Polygon.outerBoundaryIs.LinearRing.coordinates._text);
    } else if (placemark.MultiGeometry?.Polygon) {
      coordinates = parseCoordinates(placemark.MultiGeometry.Polygon.outerBoundaryIs.LinearRing.coordinates._text);
    }
    const feature: AlternateObservationZones = {
      geometry: {
        type: 'Polygon',
        coordinates: coordinates,
      },
      properties: {
        name: placemark.name._text,
      },
    };
    return feature;
  });
  return alternateZones.length > 0 ? alternateZones : null;
};
