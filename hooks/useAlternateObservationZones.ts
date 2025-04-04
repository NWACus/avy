import {UseQueryResult, useQuery} from '@tanstack/react-query';
import axios, {AxiosError} from 'axios';
import {safeFetch} from 'hooks/fetch';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {useContext} from 'react';
import {AlternateObservationZones, KMLData} from 'types/nationalAvalancheCenter';
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

export const fetchAlternateObservationZones = async (logger: LoggerProps['logger'], url: string): Promise<AlternateObservationZones> => {
  const thisLogger = logger.child({url: url});
  thisLogger.debug('Fetching alternate observation zones');
  const response = await safeFetch(() => axios.get<string>(url), thisLogger, 'alternate observation zones');
  const kmlDataJson = xml2json(response, {compact: true, spaces: 2});
  if (!response) {
    thisLogger.error('No response received from safeFetch');
  }

  const kmlData = JSON.parse(kmlDataJson) as KMLData;
  if (!kmlData || !kmlData.kml || !kmlData.kml.Document || !kmlData.kml.Document.Folder || !kmlData.kml.Document.Folder.Placemark) {
    thisLogger.error('Invalid KML data structure');
  }

  const alternateZones: AlternateObservationZones = kmlData.kml.Document.Folder.Placemark.map(placemark => {
    let coordinates: number[][] = [];
    const parseCoordinates = (coordinateString: string): number[][] => {
      const coordinateStringArray = coordinateString.trim().split(/\s+/);
      return coordinateStringArray.map(coord => {
        const [longitude, latitude] = coord.split(',');
        return [parseFloat(longitude), parseFloat(latitude)];
      });
    };
    if (placemark.Polygon) {
      const coordinatesValue = placemark.Polygon.outerBoundaryIs.LinearRing.coordinates._text;
      coordinates = parseCoordinates(coordinatesValue);
    } else if (placemark.MultiGeometry) {
      const coordinatesValue = placemark.MultiGeometry.Polygon.outerBoundaryIs.LinearRing.coordinates._text;
      coordinates = parseCoordinates(coordinatesValue);
    }
    const feature: AlternateObservationZones = {
      type: 'Feature',
      geometry: {
        type: Array.isArray(coordinates[0][0]) ? 'MultiPolygon' : 'Polygon',
        coordinates: Array.isArray(coordinates[0][0]) ? coordinates : [coordinates],
      },
      properties: {
        name: placemark.name._text,
      },
    };
    return feature;
  });
  return alternateZones;
};

function queryKey(url: string) {
  return ['alternateZoneKML', url];
}
