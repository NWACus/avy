import React from 'react';
import {ActivityIndicator, ScrollView, StyleSheet} from 'react-native';

import {range} from 'lodash';

import {Center, HStack, View, VStack} from 'components/core';
import {Body, BodyXSm, BodyXSmBlack, Title1Black} from 'components/text';
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

const renderTable = (timeSeries: TimeSeries) => {
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
    Object.entries(observations).forEach(([column, values]) => {
      if (column === 'date_time' && stationIndex !== 0) {
        // don't add multiple date time columns
        return;
      }
      if (!values.find(v => v !== null)) {
        // skip empty columns
        return;
      }
      const columnIndex = tableColumns.push({field: column, elevation}) - 1;
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
    // 3. elevation ascending within same column
    const columnA = tableColumns[a];
    const columnB = tableColumns[b];
    if (columnA.field === 'date_time') {
      return -1;
    } else if (columnB.field === 'date_time') {
      return 1;
    } else {
      return columnA.field.localeCompare(columnB.field) || columnA.elevation - columnB.elevation;
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
                  <BodyXSmBlack>{field}</BodyXSmBlack>
                  <BodyXSmBlack>{field !== 'date_time' ? elevation : ' '}</BodyXSmBlack>
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
          <Body>This is a work in progress, don't freak out!</Body>
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
        {data && renderTable(data)}
      </VStack>
    </View>
  );
};
