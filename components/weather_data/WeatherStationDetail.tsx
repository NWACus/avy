import React from 'react';
import {ActivityIndicator, ScrollView, StyleSheet} from 'react-native';

import {range} from 'lodash';

import {Center, HStack, View, VStack} from 'components/core';
import {Body, BodySm, BodyXSm, BodyXSmBlack, Title1Black} from 'components/text';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {TimeSeries, useWeatherStationTimeseries} from 'hooks/useWeatherStationTimeseries';
import {format} from 'date-fns';
import {colorLookup} from 'theme';

interface Props {
  center_id: AvalancheCenterID;
  name: string;
  station_stids: string[];
}

// TODO: plumb through active date
const date = new Date();

const formatDateTime = (input: string) => format(new Date(input), 'MM/dd HH:mm');

// TODO: synthesized column PcpSum (cumulative precip) which is a running total of Pcp1 (precip_accum_one_hour)

const preferredFieldOrder = {
  date_time: 0,
  air_temp: 1,
  relative_humidity: 2,
  wind_speed_min: 4,
  wind_speed: 5,
  wind_gust: 6,
  wind_direction: 7,

  precip_accum_one_hour: 10,
  snow_depth_24h: 11,
  snow_depth: 12,

  precip_accum: 99,
  snow_water_equiv: 99,
  pressure: 99,
  equip_temperature: 99,
  intermittent_snow: 99,
  net_solar: 99,
  solar_radiation: 99,
};

const shortFieldMap = {
  date_time: 'Time',
  air_temp: 'Temp',
  relative_humidity: 'RH',
  wind_speed_min: 'Min',
  wind_speed: 'Spd',
  wind_gust: 'Gust',
  wind_direction: 'Dir',
  precip_accum: 'precip_accum',
  snow_depth: 'SnoHt',
  snow_water_equiv: 'snow_water_equiv',
  pressure: 'Pres',
  precip_accum_one_hour: 'Pcp1',
  equip_temperature: 'EqTemp',
  snow_depth_24h: '24Sno',
  intermittent_snow: 'intermittent_snow',
  net_solar: 'SR',
  solar_radiation: 'SR',
};

const shortUnitsMap = {
  fahrenheit: '°F',
  inches: 'in',
  degrees: 'deg',
  millibar: 'mbar',
};

const shortUnits = (units: string) => shortUnitsMap[units] || units;

const TimeSeriesTable: React.FC<{timeSeries: TimeSeries}> = ({timeSeries}) => {
  if (timeSeries.STATION.length === 0) {
    return <Body>No data found.</Body>;
  }

  const times = timeSeries.STATION[0].observations.date_time.map(t => formatDateTime(t));

  type Column = {elevation: number; field: string};
  type Row = {date: string; cells: Cell[]};
  type Cell = {colIdx: number; rowIdx: number; value: number | string};

  const tableColumns: Column[] = [];
  const tableRows: Row[] = [];
  timeSeries.STATION.forEach(({elevation, observations}, stationIndex) => {
    Object.entries(observations).forEach(([field, values]) => {
      if (field === 'date_time' && stationIndex !== 0) {
        // don't add multiple date time columns
        return;
      }
      if (values.findIndex(v => v !== null) === -1) {
        // skip empty columns: when all values are null
        return;
      }
      if (field === 'solar_radiation') {
        // we don't display solar_radiation, only net_solar
        return;
      }
      const columnIndex = tableColumns.push({field, elevation}) - 1;
      values.forEach((value, rowIndex) => {
        const row = tableRows[rowIndex] || {date: times[rowIndex], cells: []};
        row.cells.push({colIdx: columnIndex, rowIdx: rowIndex, value: columnIndex === 0 ? times[rowIndex] : value});
        tableRows[rowIndex] = row;
      });
    });
  });

  // With the columns we have, what should the preferred ordering be?
  const sortedColumns = range(tableColumns.length);
  sortedColumns.sort((a, b) => {
    // Column sorting rules:
    // 1. time first
    // 2. preferred column sort after that
    // 3. elevation descending within same column
    const columnA = tableColumns[a];
    const columnB = tableColumns[b];
    if (columnA.field === 'date_time') {
      return -1;
    } else if (columnB.field === 'date_time') {
      return 1;
    } else {
      // TODO: have to sort wind values together by name, *then* by elevation :eyeroll:
      // or wait - do we onlt want wind values at the highest elevation
      return preferredFieldOrder[columnA.field] - preferredFieldOrder[columnB.field] || columnB.elevation - columnA.elevation;
    }
  });

  // With the rows we have, what should the preferred ordering be?
  const sortedRows = range(tableRows.length - 1, -1, -1); // descending by time

  const columnPadding = 3;
  const rowPadding = 2;

  return (
    <ScrollView>
      <ScrollView horizontal>
        <HStack padding={8} justifyContent="space-between" alignItems="center" bg="white">
          {sortedColumns
            .map(i => ({...tableColumns[i], columnIndex: i}))
            .map(({field, elevation, columnIndex}) => (
              <VStack key={columnIndex} justifyContent="flex-start" alignItems="stretch">
                <VStack alignItems="center" justifyContent="flex-start" flex={1} py={rowPadding} px={columnPadding}>
                  <BodyXSmBlack>{shortFieldMap[field]}</BodyXSmBlack>
                  <BodyXSmBlack>{field === 'date_time' ? 'PST' : shortUnits(timeSeries.UNITS[field])}</BodyXSmBlack>
                  <BodyXSmBlack>{field !== 'date_time' ? `${elevation}'` : ' '}</BodyXSmBlack>
                </VStack>
                {sortedRows
                  .map(i => tableRows[i])
                  .map((row, index) => (
                    <Center flex={1} key={index} bg={colorLookup(index % 2 ? 'light.100' : 'light.300')} py={rowPadding} px={columnPadding}>
                      <BodyXSm>{row.cells[columnIndex].value}</BodyXSm>
                    </Center>
                  ))}
              </VStack>
            ))}
        </HStack>
      </ScrollView>
    </ScrollView>
  );
};

export const WeatherStationDetail: React.FC<Props> = ({center_id, name, station_stids}) => {
  const {isLoading, isError, data} = useWeatherStationTimeseries({
    center: center_id,
    sources: center_id === 'NWAC' ? ['nwac'] : ['mesowest', 'snotel'],
    stids: station_stids,
    startDate: new Date(date.getTime() - 1 * 24 * 60 * 60 * 1000),
    // TODO: support 24 hour / 7 day picker
    endDate: date,
  });

  return (
    <View style={{...StyleSheet.absoluteFillObject}} bg="white">
      <VStack py={16} px={8}>
        <Title1Black>{name}</Title1Black>
        <Center bg={colorLookup('warning.200')} borderColor={colorLookup('warning.800')} borderWidth={1} py={8} my={8}>
          <Body>Work in progress</Body>
          <BodySm>If something looks weird, don't freak out :)</BodySm>
        </Center>
        {isLoading && (
          <Center width="100%" height="100%">
            <ActivityIndicator size={'large'} />
          </Center>
        )}
        {isError && (
          <Center width="100%" height="100%">
            <Body>Error loading weather station data.</Body>
          </Center>
        )}
        {data && <TimeSeriesTable timeSeries={data} />}
      </VStack>
    </View>
  );
};
