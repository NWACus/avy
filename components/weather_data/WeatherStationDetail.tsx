import React, {useState} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity} from 'react-native';

import {uniq} from 'lodash';

import {AntDesign} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {Center, Divider, HStack, View, VStack} from 'components/core';
import {AllCapsSm, Body, BodyBlack, bodySize, BodyXSm, BodyXSmBlack, Title3Black} from 'components/text';
import {compareDesc, format} from 'date-fns';
import {TimeSeries, useWeatherStationTimeseries} from 'hooks/useWeatherStationTimeseries';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {utcDateToLocalDateString} from 'utils/date';

interface Props {
  center_id: AvalancheCenterID;
  name: string;
  station_stids: string[];
  zoneName: string;
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
  precip_accum: 12,
  snow_depth_24h: 15,
  snow_depth: 16,

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
  precip_accum: 'PcpSum',
  snow_depth: 'SnoHt',
  snow_water_equiv: 'snow_water_equiv',
  pressure: 'Pres',
  precip_accum_one_hour: 'Pcp1',
  equip_temperature: 'EqTemp',
  snow_depth_24h: '24Sno',
  intermittent_snow: 'I/S_Sno',
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

const TimeSeriesTable: React.FC<{timeSeries: TimeSeries}> = React.memo(({timeSeries}) => {
  if (timeSeries.STATION.length === 0) {
    return <Body>No data found.</Body>;
  }

  type Column = {elevation: number; field: string; dataByTime: Record<string, number | string>};
  const tableColumns: Column[] = [];
  timeSeries.STATION.forEach(({elevation, observations}) => {
    Object.entries(observations).forEach(([field, values]) => {
      if (field === 'date_time') {
        // don't add station-specific date time columns
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
      const column: Column = {field: field, elevation: elevation, dataByTime: {}};
      const times = observations.date_time;
      values.forEach((value, rowIndex) => {
        column.dataByTime[times[rowIndex]] = value;
      });
      tableColumns.push(column);

      // If this is the precip_accum_one_hour column, synthesize an accumlulated precip column.
      // Note that at this point, rows are sorted ascending by time
      if (field === 'precip_accum_one_hour') {
        const accumColumn: Column = {field: 'precip_accum', elevation: elevation, dataByTime: {}};
        let accum = 0;
        values.forEach((value, rowIndex) => {
          accum += Number(value);
          accumColumn.dataByTime[times[rowIndex]] = Math.round(accum * 100.0) / 100.0;
        });
        tableColumns.push(accumColumn);
      }
    });
  });

  // With the columns we have, what should the preferred ordering be?
  tableColumns.sort((a, b) => {
    // Column sorting rules:
    // 1. preferred column sort after that
    // 2. elevation descending within same column
    // TODO: have to sort wind values together by name, *then* by elevation :eyeroll:
    // or wait - do we onlt want wind values at the highest elevation
    return preferredFieldOrder[a.field] - preferredFieldOrder[b.field] || b.elevation - a.elevation;
  });

  // Determine all of the times we need to display as rows
  // With the rows we have, what should the preferred ordering be?
  const times = uniq(tableColumns.map(column => Object.keys(column.dataByTime)).flat()).sort((a, b) => {
    return compareDesc(new Date(a), new Date(b));
  }); // descending by time

  return (
    <ScrollView style={{width: '100%', height: '100%'}}>
      <ScrollView horizontal style={{width: '100%', height: '100%'}}>
        <HStack py={8} justifyContent="space-between" alignItems="center" bg="white">
          <Row borderRightWidth={1} name={shortFieldMap['date_time']} units={'PST'} elevation={' '} data={times.map(time => formatDateTime(time))} />
          {tableColumns.map(({field, elevation, dataByTime}, columnIndex) => (
            <Row
              key={columnIndex}
              borderRightWidth={0}
              name={shortFieldMap[field]}
              units={shortUnits(timeSeries.UNITS[field])}
              elevation={elevation.toString()}
              data={times.map(time => (time in dataByTime ? dataByTime[time] : '-'))}
            />
          ))}
        </HStack>
      </ScrollView>
    </ScrollView>
  );
});

const columnPadding = 3;
const rowPadding = 2;

export const Row: React.FunctionComponent<{borderRightWidth: number; name: string; units: string; elevation: string; data: string[]}> = ({
  borderRightWidth,
  name,
  units,
  elevation,
  data,
}) => {
  return (
    <VStack justifyContent="flex-start" alignItems="stretch">
      <VStack alignItems="center" justifyContent="flex-start" flex={1} py={rowPadding} px={columnPadding} bg="blue2">
        <BodyXSmBlack color="white">{name}</BodyXSmBlack>
        <BodyXSmBlack color="white">{units}</BodyXSmBlack>
        <BodyXSmBlack color="white">{elevation}</BodyXSmBlack>
      </VStack>
      {data.map((value, index) => (
        <Center
          flex={1}
          key={index}
          bg={colorLookup(index % 2 ? 'light.100' : 'light.300')}
          py={rowPadding}
          px={columnPadding}
          borderRightWidth={borderRightWidth}
          borderColor={colorLookup('text.tertiary')}>
          <BodyXSm>{value}</BodyXSm>
        </Center>
      ))}
    </VStack>
  );
};

export const WeatherStationDetail: React.FC<Props> = ({center_id, name, station_stids, zoneName}) => {
  const [days, setDays] = useState(1);
  const navigation = useNavigation();
  const timeseries = useWeatherStationTimeseries({
    center: center_id,
    sources: center_id === 'NWAC' ? ['nwac'] : ['mesowest', 'snotel'],
    stids: station_stids,
    startDate: new Date(date.getTime() - days * 24 * 60 * 60 * 1000),
    endDate: date,
  });

  if (incompleteQueryState(timeseries)) {
    return <QueryState results={[timeseries]} />;
  }

  const data = timeseries.data;
  const warnings =
    data?.STATION?.map(({name, station_note: notes}) => notes.map(({start_date, status, note}) => ({name, start_date, status, note})))
      .flat()
      .sort((a, b) => b.start_date.localeCompare(a.start_date)) || [];

  return (
    <View style={{...StyleSheet.absoluteFillObject}} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
        <VStack width="100%" height="100%" alignItems="stretch">
          <HStack justifyContent="flex-start">
            <AntDesign.Button
              size={24}
              color={colorLookup('text')}
              name="arrowleft"
              backgroundColor="white"
              iconStyle={{marginLeft: 0, marginRight: 8}}
              style={{textAlign: 'center'}}
              onPress={() => navigation.goBack()}
            />
            <Title3Black>{zoneName}</Title3Black>
          </HStack>
          <VStack width="100%" height="100%" p={16} space={8}>
            <HStack space={8} alignItems="center">
              <BodyBlack>{name}</BodyBlack>
              {warnings.length > 0 && (
                <InfoTooltip
                  outlineIcon="bells"
                  solidIcon="bells"
                  title="Status Alerts"
                  htmlStyle={{textAlign: 'left'}}
                  content={warnings.map(w => `<h3>${w.name} (${utcDateToLocalDateString(w.start_date)})</h3><p>${w.note}</p>`).join('\n')}
                  size={bodySize}
                  style={{paddingBottom: 0, paddingTop: 1}}
                />
              )}
            </HStack>
            <Divider />
            <HStack space={16} py={8}>
              <TouchableOpacity onPress={() => setDays(1)} disabled={days === 1}>
                <View style={days === 1 ? styles.buttonSelected : styles.button}>
                  <AllCapsSm>24 hour</AllCapsSm>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDays(7)} disabled={days === 7}>
                <View style={days === 7 ? styles.buttonSelected : styles.button}>
                  <AllCapsSm>7 day</AllCapsSm>
                </View>
              </TouchableOpacity>
            </HStack>
            <TimeSeriesTable timeSeries={data} />
            {/* For some reason, the table is running off the bottom of the view, and I just don't have time to keep debugging this.
             Adding the placeholder here does the trick. :dizzy_face: */}
            <View height={16} />
          </VStack>
        </VStack>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    padding: 8,
  },
  buttonSelected: {
    borderRadius: 12,
    backgroundColor: colorLookup('primary.outline'),
    padding: 8,
  },
});
