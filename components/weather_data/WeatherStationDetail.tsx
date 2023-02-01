import React from 'react';
import {Platform, ScrollView, StyleSheet} from 'react-native';

import {View} from 'components/core';
import {Body} from 'components/text';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {useWeatherStationTimeseries} from 'hooks/useWeatherStationTimeseries';

interface Props {
  center_id: AvalancheCenterID;
  name: string;
  station_stids: string[];
}
const date = new Date();

export const WeatherStationDetail: React.FC<Props> = ({center_id, name, station_stids}) => {
  const {isLoading, isError, data} = useWeatherStationTimeseries({
    center: center_id,
    sources: center_id === 'NWAC' ? ['nwac'] : ['mesowest', 'snotel'],
    stids: station_stids,
    startDate: date,
    endDate: date,
  });

  console.log('render', isLoading, isError, data);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Body>
        Weather station detail {center_id} {name} {station_stids.join(', ')}
      </Body>
      {isLoading && <Body>loading</Body>}
      {isError && <Body>error</Body>}
      {data && (
        <ScrollView>
          <Body fontFamily={Platform.select({ios: 'Courier New', android: 'monospace'})}>{JSON.stringify(data, null, 2)}</Body>
        </ScrollView>
      )}
    </View>
  );
};
