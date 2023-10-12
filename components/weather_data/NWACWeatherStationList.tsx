import React from 'react';
import {ScrollView} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {Logger} from 'browser-bunyan';
import {ActionList} from 'components/content/ActionList';
import {Card} from 'components/content/Card';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {VStack} from 'components/core';
import {featureBounds, pointInFeature, RegionBounds} from 'components/helpers/geographicCoordinates';
import {Title3Black} from 'components/text';
import {useMapLayer} from 'hooks/useMapLayer';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {WeatherStackNavigationProps} from 'routes';
import {MapLayer, MapLayerFeature, WeatherStationCollection, WeatherStationProperties, WeatherStationSource} from 'types/nationalAvalancheCenter';
import {RequestedTimeString} from 'utils/date';

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

export interface ZoneWithWeatherStations {
  feature: MapLayerFeature;
  bounds: RegionBounds;
  stationGroups: Record<string, WeatherStationProperties[]>;
}

export const NWACStationsByZone = (mapLayer: MapLayer, stations: WeatherStationCollection, logger: Logger): ZoneWithWeatherStations[] => {
  const zones: ZoneWithWeatherStations[] = mapLayer.features.map(f => ({
    feature: f,
    bounds: featureBounds(f),
    stationGroups: {},
  }));
  stations.features
    .map(feature => feature.properties)
    .filter(s => s.source === 'nwac')
    .filter(s => !decommissionedStations.includes(s.stid))
    .forEach(s => {
      if (!s.latitude || !s.longitude) {
        return;
      }
      const matchingZones = zones.filter(zoneData =>
        pointInFeature(
          {
            latitude: s.latitude,
            longitude: s.longitude,
          },
          zoneData.feature,
        ),
      );
      const stationLogger = logger.child({
        station: {
          id: s.id,
          name: s.name,
          coordinates: {lat: s.latitude, lng: s.longitude},
        },
      });
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
  return zones;
};
export const NWACStationList: React.FunctionComponent<{token: string; requestedTime: RequestedTimeString}> = ({token, requestedTime}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const navigation = useNavigation<WeatherStackNavigationProps>();
  const mapLayerResult = useMapLayer('NWAC');
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata('NWAC', token);
  const weatherStations = weatherStationsResult.data;

  if (incompleteQueryState(mapLayerResult, weatherStationsResult) || !mapLayer || !weatherStations) {
    return <QueryState results={[mapLayerResult, weatherStationsResult]} />;
  }

  const stationsByZone = NWACStationsByZone(mapLayer, weatherStations, logger);

  const data = stationsByZone
    .map(zone => ({
      zoneName: zone.feature.properties.name,
      actions: Object.entries(zone.stationGroups)
        .map(([k, v]) => ({
          label: k,
          data: v,
          action: (name: string, data: WeatherStationProperties[]) => {
            navigation.navigate('stationsDetail', {
              center_id: 'NWAC',
              stations: data
                .map(s => ({id: s.stid, source: s.source}))
                .reduce((accum, value) => {
                  accum[value.id] = value.source;
                  return accum;
                }, {} as Record<string, WeatherStationSource>),
              name: name,
              requestedTime: requestedTime,
              zoneName: zone.feature.properties.name,
            });
          },
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter(d => d.actions.length > 0);
  return (
    <ScrollView style={{width: '100%', height: '100%'}}>
      <VStack space={8}>
        {data.map((d, i) => (
          <Card borderRadius={0} borderColor="white" header={<Title3Black>{d.zoneName}</Title3Black>} key={i}>
            <ActionList actions={d.actions} />
          </Card>
        ))}
      </VStack>
    </ScrollView>
  );
};
