import React, {useContext} from 'react';

import {useQuery, UseQueryResult} from '@tanstack/react-query';

import {ClientContext, ClientProps} from 'clientContext';
import {boundsForRegions, featureBounds, pointInFeature, RegionBounds} from 'components/helpers/geographicCoordinates';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {ApiError, OpenAPI, StationMetadata, StationMetadataService} from 'types/generated/snowbound';
import {Feature, MapLayer} from 'types/nationalAvalancheCenter';

type Source = 'nwac' | 'snotel' | 'mesowest';

interface Props {
  mapLayer?: MapLayer;
  token?: string;
  sources: Source[];
}

export interface ZoneResult {
  zoneId: number;
  name: string;
  stationGroups: Record<string, StationMetadata[]>;
}

const stationGroupMapping = {
  // Snoqualmie Pass
  'Alpental Ski Area': ['1', '2', '3'],
  'Snoqualmie Pass': ['21', '22', '23'],

  // Stevens Pass
  'Stevens Pass Ski Area - Tye Mill Chair, Skyline Chair': ['17', '18'],
  'Stevens Pass - WSDOT Schmidt Haus': ['13'],
  'Grace Lakes & Old Faithful': ['14', '51'],
  'Stevens Pass Ski Area - Brooks Chair': ['50'],

  // West South
  'Crystal Mt Ski Area': ['28', '29'],
  'Crystal Mt. - Green Valley & Campbell Basin': ['27', '54'],
  'Mt Baker Ski Area': ['5', '6'],
  'Mount Rainier - Sunrise': ['30', '31'],
  'Mount Rainier - Paradise': ['35', '36'],
  'Mount Rainier - Camp Muir': ['34'],
  'Chinook Pass': ['32', '33'],
  'White Pass': ['37', '39', '49'],
  'Mt St Helens': ['40'],

  // West Central
  'White Chuck': ['57'],

  // East Central
  'Mission Ridge Ski Area': ['24', '25', '26'],
  'Tumwater Mt. & Leavenworth': ['19', '53'],
  'Dirtyface Mt': ['10'],

  // East North
  'Washington Pass': ['8', '9'],

  // Mt Hood
  'Skibowl Ski Area - Government Camp': ['46', '47'],
  'Timberline Lodge': ['44', '56'],
  'Timberline Ski Area - Magic Mile Chair': ['45'],
  'Mt Hood Meadows Ski Area': ['42', '43'],
  'Mt. Hood Meadows Cascade Express': ['41'],
};

const decommissionedStations = [
  '15', // Stevens Pass - Brooks Wind (Retired 2019)
];

interface zoneData {
  feature: Feature;
  bounds: RegionBounds;
  stationGroups: Record<string, StationMetadata[]>;
}

export const useWeatherStations = ({mapLayer, token, sources}: Props): UseQueryResult<ZoneResult[], ApiError | Error> => {
  const clientProps = useContext<ClientProps>(ClientContext);
  const sourceString = sources.join(',');
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = ['stations', sourceString];
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<ZoneResult[], ApiError | Error>(
    key,
    async () => {
      if (!mapLayer || !token) {
        return [];
      }
      // get list of zones for the center
      const mapLayerZones: Feature[] = mapLayer.features;
      const dataByZone: zoneData[] = mapLayerZones.map(f => ({feature: f, bounds: featureBounds(f), stationGroups: {}}));

      // get the overall bounding box for the center
      const centerBounds = boundsForRegions(Object.values(dataByZone).map(v => v.bounds));

      OpenAPI.BASE = clientProps.snowboundHost;
      const stations: StationMetadata[] = (await StationMetadataService.readStationMetadataWxV1StationMetadataGet({
        source: sourceString,
        token,
        limit: 250,
        // bbox: Bounding box, comma separated list from lower left to upper right. For example, '-116,45,-115,47'
        bbox: [centerBounds.topLeft.longitude, centerBounds.bottomRight.latitude, centerBounds.bottomRight.longitude, centerBounds.topLeft.latitude].map(x => String(x)).join(','),
      })) as StationMetadata[];

      // Take the list of returned stations, and figure out which zone in the center they belong to
      stations
        .filter(s => !decommissionedStations.includes(s.stid))
        .forEach(s => {
          const {lat: latitude, lng: longitude} = s.coordinates;
          if (!latitude || !longitude) {
            return;
          }
          const matchingZones = dataByZone.filter(zoneData => pointInFeature({latitude, longitude}, zoneData.feature));
          const stationLogger = thisLogger.child({station: {id: s.id, name: s.name, coordinates: s.coordinates}});
          if (matchingZones.length === 0) {
            stationLogger.warn(`unable to find matching zone for weather station`);
          } else if (matchingZones.length > 1) {
            stationLogger.warn({matchingZones: matchingZones.map(z => z.feature.properties.name)}, `found multiple matching zones for weather station`);
          } else {
            // Mapped station to a single zone. Now, should it appear in the UI as part of a group?
            const groupMapping = Object.entries(stationGroupMapping).find(([_name, stids]) => stids.includes(s.stid));
            const name = groupMapping ? groupMapping[0] : s.name;
            matchingZones[0].stationGroups[name] = matchingZones[0].stationGroups[name] || [];
            matchingZones[0].stationGroups[name].push(s);
          }
        });

      return dataByZone.map(dz => ({zoneId: dz.feature.id, name: dz.feature.properties.name, stationGroups: dz.stationGroups}));
    },
    {
      staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
      cacheTime: Infinity, // hold on to this cached data forever
      enabled: !!token && !!mapLayer,
    },
  );
};
