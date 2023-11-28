import React, {useRef, useState} from 'react';
import {Animated} from 'react-native';

import {uniq} from 'lodash';

import {useNavigation} from '@react-navigation/native';
import {ButtonBar} from 'components/content/ButtonBar';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {Center, Divider, HStack, View, VStack} from 'components/core';
import {Body, BodyBlack, bodySize, BodyXSm, BodyXSmBlack} from 'components/text';
import {compareDesc, format} from 'date-fns';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useWeatherStationTimeseries} from 'hooks/useWeatherStationTimeseries';
import {colorLookup} from 'theme';
import {AvalancheCenterID, StationNote, WeatherStationSource, WeatherStationTimeseries} from 'types/nationalAvalancheCenter';
import {parseRequestedTimeString, RequestedTimeString, utcDateToLocalDateString} from 'utils/date';

interface DataGridProps {
  data: string[][];
  columnNames: string[];
  columnWidths: number[];
  rowHeights: number[];
}

function DataGrid({data: _data, columnNames: _columnNames, columnWidths, rowHeights}: DataGridProps) {
  const width = columnWidths.reduce((a, b) => a + b, 0);
  const height = rowHeights.reduce((a, b) => a + b, 0);
  const columns = columnWidths.length - 1;
  const rows = rowHeights.length - 1;
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const columnHeaderHeight = rowHeights[0]; // useRef(new Animated.Value(rowHeights[0])).current;
  const rowHeaderWidth = columnWidths[0]; // useRef(new Animated.Value(columnWidths[0])).current;

  return (
    <Animated.ScrollView
      horizontal
      bounces={false}
      style={{width: '100%', height: '100%'}}
      // snapToOffsets={columnWidths.slice(1)}
      onScroll={Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: {
                x: scrollX,
              },
            },
          },
        ],
        {useNativeDriver: true},
      )}
      scrollEventThrottle={1}>
      <Animated.ScrollView
        bounces={false}
        style={{width: '100%', height: '100%'}}
        // snapToOffsets={rowHeights.slice(1)}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {useNativeDriver: true},
        )}
        scrollEventThrottle={1}>
        <View style={{width: width, height: height}}>
          {new Array(rows).fill(0).map((_, rowIndex) =>
            new Array(columns).fill(0).map((_, columnIndex) => (
              <View
                key={`${rowIndex}-${columnIndex}`}
                style={{
                  width: columnWidths[columnIndex + 1],
                  height: rowHeights[rowIndex + 1],
                  backgroundColor: colorLookup((rowIndex + columnIndex) % 2 ? 'light.100' : 'light.300'),
                  position: 'absolute',
                  top: rowHeights[0] + rowHeights.slice(1, rowIndex + 1).reduce((a, b) => a + b, 0),
                  left: columnWidths[0] + columnWidths.slice(1, columnIndex + 1).reduce((a, b) => a + b, 0),
                }}>
                <BodyXSm>{`x: ${columnIndex}, y: ${rowIndex}`}</BodyXSm>
              </View>
            )),
          )}
          <Animated.View
            style={{
              width: width - columnWidths[0],
              height: rowHeights[0],
              position: 'absolute',
              top: 0,
              left: rowHeaderWidth, // Animated.add(scrollX, rowHeaderWidth),
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              transform: [{translateY: scrollY}],
            }}>
            {new Array(columns).fill(0).map((_, columnIndex) => (
              <Center
                key={columnIndex}
                style={{
                  width: columnWidths[columnIndex + 1],
                  height: rowHeights[0],
                  backgroundColor: colorLookup('light.300'),
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: colorLookup('text.tertiary'),
                }}>
                <BodyXSm>{columnIndex}</BodyXSm>
              </Center>
            ))}
          </Animated.View>
          <Animated.View
            style={{
              width: columnWidths[0],
              height: height - rowHeights[0],
              position: 'absolute',
              top: columnHeaderHeight, // Animated.add(scrollY, columnHeaderHeight),
              left: 0,
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              transform: [{translateX: scrollX}],
            }}>
            {new Array(rows).fill(0).map((_, rowIndex) => (
              <Center
                key={rowIndex}
                style={{
                  width: columnWidths[0],
                  height: rowHeights[rowIndex + 1],
                  backgroundColor: colorLookup('light.300'),
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: colorLookup('text.tertiary'),
                }}>
                <BodyXSm>{rowIndex}</BodyXSm>
              </Center>
            ))}
          </Animated.View>
          <Animated.View
            style={{
              width: rowHeaderWidth,
              height: columnHeaderHeight,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderColor: colorLookup('text.tertiary'),
              backgroundColor: colorLookup('light.300'),
              position: 'absolute',
              top: 0,
              left: 0,
              transform: [{translateX: scrollX}, {translateY: scrollY}],
            }}></Animated.View>
        </View>
      </Animated.ScrollView>
    </Animated.ScrollView>
  );
}

interface Props {
  center_id: AvalancheCenterID;
  name: string;
  zoneName: string;
  stations: Record<string, WeatherStationSource>;
  requestedTime: RequestedTimeString;
}

export const formatDateTime = (input: string) => format(new Date(input), 'MM/dd HH:mm');

const preferredFieldOrder: Record<string, number> = {
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
  snow_depth_24hr: 17,

  snow_water_equiv: 99,
  pressure: 99,
  equip_temperature: 99,
  intermittent_snow: 99,
  net_solar: 99,
  solar_radiation: 99,
};

const shortFieldMap: Record<string, string> = {
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
  snow_water_equiv_24hr: '\u2206SWE',
  pressure: 'Pres',
  precip_accum_one_hour: 'Pcp1',
  equip_temperature: 'EqTemp',
  snow_depth_24h: '24Sno',
  snow_depth_24hr: '\u2206SnoHt',
  intermittent_snow: 'I/S_Sno',
  net_solar: 'SR',
  solar_radiation: 'SR',
};

const shortUnitsMap: Record<string, string> = {
  fahrenheit: '°F',
  inches: 'in',
  degrees: 'deg',
  millibar: 'mbar',
};

const shortUnits = (units: string): string => shortUnitsMap[units] || units;

const TimeSeriesTable: React.FC<{timeSeries: WeatherStationTimeseries}> = ({timeSeries}) => {
  if (timeSeries.STATION.length === 0) {
    return <Body>No data found.</Body>;
  }

  type Column = {elevation: number | undefined | null; field: string; dataByTime: Record<string, number | string | null>};
  const tableColumns: Column[] = [];
  for (const station of timeSeries.STATION) {
    const dataByTimeByField: Record<string, Record<string, number | string | null>> = {};
    for (const observation of station.observations) {
      const date = observation['date_time'];
      if (!date) {
        continue; // can't record this time-less value
      }
      for (const [field, value] of Object.entries(observation)) {
        if (field === 'date_time') {
          // don't add station-specific date time columns
          continue;
        }
        if (field === 'solar_radiation') {
          // we don't display solar_radiation, only net_solar
          continue;
        }
        if (!dataByTimeByField[field]) {
          dataByTimeByField[field] = {};
        }
        dataByTimeByField[field][date] = value;
      }
    }
    for (const field of Object.keys(dataByTimeByField)) {
      const values: (string | number | null)[] = Object.values(dataByTimeByField[field]);
      if (values.findIndex(v => v !== null) === -1) {
        // skip empty columns: when all values are null
        continue;
      }
      tableColumns.push({field: field, elevation: station.elevation, dataByTime: dataByTimeByField[field]});
    }
  }

  // Determine all the times we need to display as rows
  const times = uniq(tableColumns.map(column => Object.keys(column.dataByTime)).flat()).sort((a, b) => {
    return compareDesc(new Date(a), new Date(b));
  }); // descending by time

  // Compute an accumulated precipitation column if we have hourly precipitation data
  const precip = tableColumns.find(column => column.field === 'precip_accum_one_hour');
  if (precip) {
    const precip_accum: Column = {
      dataByTime: {},
      field: 'precip_accum',
      elevation: precip.elevation,
    };
    let accum = 0;
    for (const time of [...times].reverse()) {
      if (time in precip.dataByTime) {
        accum += Number(precip.dataByTime[time]);
        precip_accum.dataByTime[time] = accum.toFixed(2);
      }
    }
    tableColumns.push(precip_accum);
  }

  // With the columns we have, what should the preferred ordering be?
  tableColumns.sort((a, b) => {
    // Column sorting rules:
    // 1. preferred column sort after that
    // 2. elevation descending within same column
    // TODO: have to sort wind values together by name, *then* by elevation :eyeroll:
    // or wait - do we onlt want wind values at the highest elevation
    return preferredFieldOrder[a.field] - preferredFieldOrder[b.field] || (a.elevation && b.elevation ? b.elevation - a.elevation : -1);
  });

  return <DataGrid data={[]} columnNames={[]} columnWidths={[100, ...tableColumns.map(() => 50)]} rowHeights={[100, ...times.map(() => 50)]} />;

  // return (
  //   <ScrollView style={{width: '100%', height: '100%'}}>
  //     <ScrollView horizontal style={{width: '100%', height: '100%'}}>
  //       <HStack py={8} justifyContent="space-between" alignItems="center" bg="white">
  //         <Column borderRightWidth={1} name={shortFieldMap['date_time']} units={'PST'} elevation={' '} data={times.map(time => formatDateTime(time))} />
  //         {tableColumns.map(({field, elevation, dataByTime}, columnIndex) => (
  //           <Column
  //             key={columnIndex}
  //             borderRightWidth={0}
  //             name={shortFieldMap[field]}
  //             units={shortUnits(timeSeries.UNITS[field])}
  //             elevation={elevation ? elevation.toString() : ''}
  //             data={times.map(time => (time in dataByTime ? (dataByTime[time] === null ? '-' : String(dataByTime[time])) : '-'))}}
  //           />
  //         ))}
  //       </HStack>
  //     </ScrollView>
  //   </ScrollView>
  // );
};

const columnPadding = 3;
const rowPadding = 2;

export const Column: React.FunctionComponent<{borderRightWidth: number; name: string; units: string; elevation?: string; data: string[]}> = ({
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
        {elevation && <BodyXSmBlack color="white">{elevation}</BodyXSmBlack>}
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

export const WeatherStationsDetail: React.FC<Props> = ({center_id, name, stations, zoneName, requestedTime}) => {
  const [days, setDays] = useState(1);
  const navigation = useNavigation();
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const requestedTimeDate = parseRequestedTimeString(requestedTime);
  const timeseriesResult = useWeatherStationTimeseries(metadata?.widget_config.stations?.token, stations, requestedTimeDate, {days: days});
  const timeseries = timeseriesResult.data;

  React.useEffect(() => {
    navigation.setOptions({title: zoneName});
  }, [navigation, zoneName]);

  if (incompleteQueryState(avalancheCenterMetadataResult, timeseriesResult) || !metadata || !timeseries) {
    return <QueryState results={[avalancheCenterMetadataResult, timeseriesResult]} />;
  }

  interface noteWithName extends StationNote {
    name: string;
  }

  const warnings: noteWithName[] = [];
  for (const station of timeseries.STATION) {
    if ('station_note' in station) {
      for (const note of station.station_note) {
        warnings.push({
          name: station.name,
          ...note,
        });
      }
    }
  }
  warnings.sort((a, b) => b.start_date.localeCompare(a.start_date));

  return (
    <VStack width="100%" height="100%" alignItems="stretch">
      <VStack width="100%" height="100%" p={16} space={8}>
        <HStack space={8} alignItems="center">
          <BodyBlack style={{textTransform: 'capitalize'}}>{name.toLowerCase()}</BodyBlack>
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
        <ButtonBar
          alignSelf="flex-start"
          flex={0}
          items={[
            {label: '24 hour', value: 1},
            {label: '7 day', value: 7},
          ]}
          selectedItem={days}
          onSelectionChange={setDays}
          size="small"
          paddingTop={6}
        />
        <TimeSeriesTable timeSeries={timeseries} />
        {/* TODO(skuznets): For some reason, the table is running off the bottom of the view, and I just don't have time to keep debugging this.
             Adding the placeholder here does the trick. :dizzy_face: */}
        <View height={72} />
      </VStack>
    </VStack>
  );
};
