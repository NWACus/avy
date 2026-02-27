import React, {useCallback, useMemo, useState} from 'react';

import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {compareDesc} from 'date-fns';
import {uniq} from 'lodash';
import {usePostHog} from 'posthog-react-native';

import {ButtonBar} from 'components/content/ButtonBar';
import {DataGrid} from 'components/content/DataGrid';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {Center, Divider, HStack, View, VStack} from 'components/core';
import {Body, BodyBlack, bodySize, BodyXSm, BodyXSmBlack} from 'components/text';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useWeatherStationTimeseries} from 'hooks/useWeatherStationTimeseries';
import {colorLookup} from 'theme';
import {AvalancheCenterID, StationNote, WeatherStationSource, WeatherStationTimeseries} from 'types/nationalAvalancheCenter';
import {formatInTimeZone, parseRequestedTimeString, RequestedTimeString, utcDateToLocalDateString} from 'utils/date';

interface Props {
  center_id: AvalancheCenterID;
  name: string;
  zoneName: string;
  stations: Record<string, WeatherStationSource>;
  requestedTime: RequestedTimeString;
}

export const formatDateTime = (timezone: string) => (input: string) => formatInTimeZone(new Date(input), timezone, 'MM/dd HH:mm');

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

const shortField = (field: string): string => shortFieldMap[field] || field;

const shortUnitsMap: Record<string, string> = {
  fahrenheit: '°F',
  inches: 'in',
  degrees: 'deg',
  millibar: 'mbar',
  'MJ/m**2': 'MJ/m²',
};

const shortUnits = (units: string): string => shortUnitsMap[units] || units;

// Don't display any of the following fields. Soil temperature can be one of soil_temperature_a/b/c
const shouldSkipField = (fieldName: string): boolean =>
  fieldName === 'date_time' || fieldName === 'solar_radiation' || fieldName === 'battery_voltage' || fieldName.includes('soil_temperature');

const TimeSeriesTable: React.FC<{timeSeries: WeatherStationTimeseries}> = ({timeSeries}) => {
  type Column = {
    elevation: number | undefined | null;
    field: string;
    dataByTime: Record<string, number | string | null>;
  };
  const tableColumns: Column[] = useMemo(() => {
    const columns: Column[] = [];
    for (const station of timeSeries.STATION) {
      const dataByTimeByField: Record<string, Record<string, number | string | null>> = {};
      for (const observation of station.observations) {
        const date = observation['date_time'];
        if (!date) {
          continue; // can't record this time-less value
        }
        for (const [field, value] of Object.entries(observation)) {
          if (shouldSkipField(field)) {
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
        columns.push({field: field, elevation: station.elevation, dataByTime: dataByTimeByField[field]});
      }
    }
    return columns;
  }, [timeSeries]);

  // Determine all the times we need to display as rows
  const times = useMemo(
    () =>
      uniq(tableColumns.map(column => Object.keys(column.dataByTime)).flat()).sort((a, b) => {
        return compareDesc(new Date(a), new Date(b));
      }), // descending by time
    [tableColumns],
  );

  useMemo(() => {
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
      timeSeries.UNITS['precip_accum'] = 'inches';
    }

    // With the columns we have, what should the preferred ordering be?
    tableColumns.sort((a, b) => {
      // Column sorting rules:
      // 1. preferred column sort, after that
      // 2. elevation descending within same column
      // TODO: have to sort wind values together by name, *then* by elevation :eyeroll:
      // or wait - do we only want wind values at the highest elevation
      return preferredFieldOrder[a.field] - preferredFieldOrder[b.field] || (a.elevation && b.elevation ? b.elevation - a.elevation : -1);
    });
  }, [tableColumns, times, timeSeries.UNITS]);

  // DataGrid expects data in row-major order, so we need to transpose our data
  const data: string[][] = useMemo(() => {
    const result = [];
    for (const time of times) {
      result.push(tableColumns.map(column => String(column.dataByTime[time] !== null ? column.dataByTime[time] : '-')));
    }
    return result;
  }, [tableColumns, times]);

  // Passed to DataGrid to render an individual cell
  const renderCell = useCallback(
    ({rowIndex, item}: {rowIndex: number; item: string}) => (
      <Center flex={1} backgroundColor={colorLookup(rowIndex % 2 ? 'light.100' : 'light.300')}>
        <BodyXSm>{item}</BodyXSm>
      </Center>
    ),
    [],
  );

  // Passed to DataGrid to render an individual row header (in this case, the time)
  const renderRowHeader = useCallback(
    ({item, rowIndex}: {rowIndex: number; item: string}) => (
      <Center flex={1} backgroundColor={colorLookup(rowIndex % 2 ? 'light.100' : 'light.300')} borderRightWidth={1} borderColor={colorLookup('text.tertiary')}>
        <BodyXSm>{item}</BodyXSm>
      </Center>
    ),
    [],
  );

  // Passed to DataGrid to render an individual column header (in this case, the label, units and elevation)
  const renderColumnHeader = useCallback(
    ({
      item: {name, units, elevation},
    }: {
      item: {
        name: string;
        units: string;
        elevation?: string;
      };
    }) => (
      <VStack
        flex={1}
        alignItems="center"
        justifyContent="flex-start"
        py={rowPadding}
        px={columnPadding}
        bg="blue2"
        borderBottomWidth={1}
        borderColor={colorLookup('text.tertiary')}>
        <BodyXSmBlack color="white">{name}</BodyXSmBlack>
        <BodyXSmBlack color="white">{units}</BodyXSmBlack>
        {elevation && <BodyXSmBlack color="white">{elevation}</BodyXSmBlack>}
      </VStack>
    ),
    [],
  );

  // Passed to DataGrid to render the top-left corner cell. Shows the "Time" label and "PST" units
  const renderCornerHeader = useCallback(
    () => (
      <VStack
        flex={1}
        alignItems="center"
        justifyContent="flex-start"
        py={rowPadding}
        px={columnPadding}
        bg="blue2"
        borderBottomWidth={1}
        borderColor={colorLookup('text.tertiary')}>
        <BodyXSmBlack color="white">Time</BodyXSmBlack>
        <BodyXSmBlack color="white">PST</BodyXSmBlack>
      </VStack>
    ),
    [],
  );

  return (
    <DataGrid
      data={data}
      columnHeaderData={tableColumns.map(column => ({
        name: shortField(column.field),
        units: shortUnits(timeSeries.UNITS[column.field]),
        elevation: column.elevation?.toString() || '',
      }))}
      rowHeaderData={times.map(time => formatDateTime('America/Los_Angeles')(time))}
      columnWidths={[
        70,
        ...tableColumns.map(({field}) => {
          const numChars = Math.max(shortField(field).length, shortUnits(timeSeries.UNITS[field]).length);
          if (numChars > 4) return numChars * 10;
          return 40;
        }),
      ]}
      rowHeights={[60, ...times.map(() => 30)]}
      renderCell={renderCell}
      renderRowHeader={renderRowHeader}
      renderColumnHeader={renderColumnHeader}
      renderCornerHeader={renderCornerHeader}
    />
  );
};

const columnPadding = 3;
const rowPadding = 2;

export const WeatherStationsDetail: React.FC<Props> = ({center_id, name, stations, zoneName, requestedTime}) => {
  const [days, setDays] = useState(1);
  const navigation = useNavigation();
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const requestedTimeDate = parseRequestedTimeString(requestedTime);
  const timeseriesResult = useWeatherStationTimeseries(metadata?.widget_config.stations?.token, stations, requestedTimeDate, {days: days});
  const timeseries = timeseriesResult.data;
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id && name) {
      postHog.screen('weatherStations', {
        center: center_id,
        name: name,
      });
    }
  }, [postHog, center_id, name]);
  useFocusEffect(recordAnalytics);

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
              outlineIcon="notifications-outline"
              solidIcon="notifications-outline"
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
        {timeseries.STATION.length === 0 ? <Body>No data found.</Body> : <TimeSeriesTable timeSeries={timeseries} />}
        <View height={16} />
      </VStack>
    </VStack>
  );
};
