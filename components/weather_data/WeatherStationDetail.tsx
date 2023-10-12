import React, {useState} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity} from 'react-native';

import * as Sentry from 'sentry-expo';

import {InfoTooltip} from 'components/content/InfoTooltip';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {Divider, HStack, View, VStack} from 'components/core';
import {AllCapsSm, BodyBlack, bodySize} from 'components/text';
import {Column, formatDateTime} from 'components/weather_data/WeatherStationsDetail';
import {compareDesc} from 'date-fns';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useWeatherStationTimeseries} from 'hooks/useWeatherStationTimeseries';
import {colorLookup} from 'theme';
import {AvalancheCenterID, StationNote, Variable, WeatherStationSource} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {formatInTimeZone, parseRequestedTimeString, RequestedTimeString, utcDateToLocalDateString} from 'utils/date';

interface Props {
  center_id: AvalancheCenterID;
  stationId: string;
  source: WeatherStationSource;
  requestedTime: RequestedTimeString;
}

interface columnData {
  variable: Variable;
  data: (number | string | null)[];
}
export const WeatherStationDetail: React.FC<Props> = ({center_id, stationId, source, requestedTime}) => {
  const [days, setDays] = useState(1);
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const requestedTimeDate = parseRequestedTimeString(requestedTime);
  const identifier: Record<string, WeatherStationSource> = {};
  identifier[stationId] = source;
  const timeseriesResult = useWeatherStationTimeseries(metadata?.widget_config.stations?.token, identifier, requestedTimeDate, {days: days});
  const timeseries = timeseriesResult.data;

  if (incompleteQueryState(avalancheCenterMetadataResult, timeseriesResult) || !metadata || !timeseries) {
    return <QueryState results={[avalancheCenterMetadataResult, timeseriesResult]} />;
  }

  if (timeseries.STATION.length !== 1) {
    const message = `Avalanche center ${center_id} had no weather station with id ${stationId}`;
    Sentry.Native.captureException(new Error(message));
    return <NotFound what={[new NotFoundError(message, 'weather station')]} />;
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

  const observations = timeseries.STATION[0].observations.filter(i => 'date_time' in i && i['date_time']);
  observations.sort((a, b) => {
    return compareDesc(new Date(a['date_time'] || ''), new Date(b['date_time'] || ''));
  });

  const variables = orderStationVariables(timeseries.VARIABLES, timeseries.STATION[0].timezone);
  const columns: columnData[] = variables.map(v => ({variable: v, data: []}));
  for (const observation of observations) {
    for (const column of columns) {
      if (column.variable.variable in observation) {
        column.data.push(observation[column.variable.variable]);
      } else {
        column.data.push(null);
      }
    }
  }

  return (
    <VStack width="100%" height="100%" alignItems="stretch">
      <VStack width="100%" height="100%" p={16} space={8}>
        <HStack space={8} alignItems="center">
          <BodyBlack style={{textTransform: 'capitalize'}}>{timeseries.STATION[0].name.toLowerCase()}</BodyBlack>
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
        <ScrollView style={{width: '100%', height: '100%'}}>
          <ScrollView horizontal style={{width: '100%', height: '100%'}}>
            <HStack py={8} justifyContent="space-between" alignItems="center" bg="white">
              {columns.map(({variable, data}, columnIndex) => (
                <Column
                  key={columnIndex}
                  borderRightWidth={columnIndex == 0 ? 1 : 0}
                  name={formatVariable(variable)}
                  units={formatUnits(variable, timeseries.UNITS)}
                  data={formatData(variable, data)}
                />
              ))}
            </HStack>
          </ScrollView>
        </ScrollView>
        {/* TODO(skuznets): For some reason, the table is running off the bottom of the view, and I just don't have time to keep debugging this.
             Adding the placeholder here does the trick. :dizzy_face: */}
        <View height={16} />
      </VStack>
    </VStack>
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

// the following is adapted from the NAC Vue.js application - unfortunately this is logic that will for the meanwhile
// live client-side and must be reproduced in all clients that render tables from this data.
// https://github.com/NationalAvalancheCenter/station-map-widget/blob/main/src/utils/station.js

const variableOrder = [
  'station',
  'elevation',
  'date_time',
  'air_temp',
  'relative_humidity',
  'dew_point_temperature',
  'wind_speed_min',
  'wind_speed',
  'wind_gust',
  'wind_direction',
  'precip_accum_one_hour',
  'precip_cumsum',
  'precip_accum',
  'precip_accum_24hr',
  'snow_water_equiv',
  'snow_water_equiv_24hr',
  'snow_depth_24h',
  'snow_depth',
  'snow_depth_24hr',
  'intermittent_snow',
  'pressure',
  'equip_temperature',
] as const;

type variableName = (typeof variableOrder)[number];

const variableShortNames: Record<variableName, string> = {
  station: 'Station',
  elevation: 'Elev',
  date_time: 'Time',
  air_temp: 'Temp',
  relative_humidity: 'RH',
  dew_point_temperature: 'DewP',
  wind_speed_min: 'Min',
  wind_speed: 'Spd',
  wind_gust: 'Gust',
  wind_direction: 'Dir',
  precip_accum_one_hour: 'Pcp1',
  precip_cumsum: 'PcpSum',
  precip_accum: 'PcpAc',
  precip_accum_24hr: '\u2206Pcp',
  snow_water_equiv: 'SWE',
  snow_water_equiv_24hr: '\u2206SWE',
  snow_depth_24h: '24Sno',
  snow_depth: 'SnoHt',
  snow_depth_24hr: '\u2206SnoHt',
  intermittent_snow: 'I/S_Sno',
  pressure: 'Pres',
  equip_temperature: 'EqTemp',
};

const unitShortNames: Record<string, string> = {
  inches: 'in',
  fahrenheit: 'F',
  degrees: 'deg',
  millibar: 'mbar',
  'W/m**2': 'W/m2',
  celsius: 'C',
  millimeters: 'mm',
} as const;

export const formatVariable = (variable: Variable): string => {
  if (variable.variable in variableShortNames) {
    return variableShortNames[variable.variable as variableName];
  } else {
    const matches = variable.variable.replace('_', ' ').match(/\b(\w)/g); // ['J','S','O','N']
    if (matches) {
      return matches.join('').toUpperCase();
    } else {
      return variable.long_name;
    }
  }
};
export const formatUnits = (variable: Variable, units: Record<string, string>): string => {
  const unit: string = variable.default_unit;
  if (unit in unitShortNames) {
    return unitShortNames[unit];
  }
  if (!unit && variable.variable in units) {
    return units[variable.variable];
  }
  return unit || '';
};

export const formatData = (variable: Variable, data: (number | string | null)[]): string[] => {
  let formatter: (i: string | number | null) => string | null;
  switch (variable.variable) {
    case 'date_time':
      formatter = (i: string | number | null) => (i ? formatDateTime(String(i)) : null);
      break;
    case 'wind_direction':
      formatter = (i: string | number | null) => windDirection(Number(i));
      break;
    default:
      formatter = (i: string | number | null) => (i ? i.toString() : null);
      break;
  }

  return data.map(i => formatter(i) || '-');
};

// orderStationVariables takes a list of variables exposed by a station and re-orders them, first listing
// the known variables in the order we expect, then following with unknown variables in the oder provided
// by the station API itself.
export const orderStationVariables = (stationVariables: Variable[], timezone: string): Variable[] => {
  const out: Variable[] = [];
  for (const item of variableOrder) {
    const found = stationVariables.find(v => v.variable === item);
    if (found) {
      out.push(found);
    } else if (item === 'date_time') {
      out.push({
        default_unit: formatInTimeZone(new Date(), timezone, 'z'),
        english_unit: '',
        long_name: '',
        metric_unit: '',
        rounding: 0,
        variable: 'date_time',
      });
    }
  }
  for (const item of stationVariables) {
    if (item.variable in variableShortNames) {
      continue;
    }
    out.push(item);
  }
  return out;
};

export function windDirection(deg: number | null): string | null {
  if (deg == null) {
    return null;
  } else if (deg >= 348.75 && deg <= 360) {
    return 'N';
  } else if (deg >= 0 && deg < 11.25) {
    return 'N';
  } else if (deg >= 11.25 && deg < 33.75) {
    return 'NNE';
  } else if (deg >= 33.75 && deg < 56.25) {
    return 'NE';
  } else if (deg >= 56.25 && deg < 78.75) {
    return 'ENE';
  } else if (deg >= 78.75 && deg < 101.25) {
    return 'E';
  } else if (deg >= 101.25 && deg < 123.75) {
    return 'ESE';
  } else if (deg >= 123.75 && deg < 146.25) {
    return 'SE';
  } else if (deg >= 146.25 && deg < 168.75) {
    return 'SSE';
  } else if (deg >= 168.75 && deg < 191.25) {
    return 'S';
  } else if (deg >= 191.25 && deg < 213.75) {
    return 'SSW';
  } else if (deg >= 213.75 && deg < 236.25) {
    return 'SW';
  } else if (deg >= 236.25 && deg < 258.75) {
    return 'WSW';
  } else if (deg >= 258.75 && deg < 281.25) {
    return 'W';
  } else if (deg >= 281.25 && deg < 303.75) {
    return 'WNW';
  } else if (deg >= 303.75 && deg < 326.25) {
    return 'NW';
  } else if (deg >= 326.25 && deg < 348.75) {
    return 'NNW';
  } else {
    return '';
  }
}
