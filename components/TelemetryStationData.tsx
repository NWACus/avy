import React from 'react';
import {useTimeSeries} from '../hooks/useTimeseries';
import {useAvalancheCenterMetadata} from '../hooks/useAvalancheCenterMetadata';
import {Easing, StyleSheet, View, Text, ActivityIndicator, ScrollView, useWindowDimensions} from 'react-native';

import {Chart, Line, Area, HorizontalAxis, VerticalAxis} from 'react-native-responsive-linechart';
import {curveBasis, line, scaleLinear, scaleTime} from 'd3';
import {max, min, parseISO, format} from 'date-fns';
import {Variable, VariableMetadata} from '../types/snowbound';

export const TelemetryStationData: React.FunctionComponent<{
  center_id: string;
  source: string;
  station_id: number;
}> = ({center_id, source, station_id}) => {
  const {isLoading: isMetadataLoading, isError: isMetadataError, data: avalancheCenter, error: metadataError} = useAvalancheCenterMetadata(center_id);
  const {
    isLoading: isTimeseriesLoading,
    isError: isTimeseriesError,
    data: timeseries,
    error: timeseriesError,
  } = useTimeSeries(station_id, source, avalancheCenter?.widget_config?.stations?.token);

  if (isMetadataLoading || isTimeseriesLoading) {
    return <ActivityIndicator />;
  }
  if (isMetadataError || isTimeseriesError) {
    return (
      <View>
        {isMetadataError && <Text>{`Could not fetch ${center_id} properties: ${metadataError?.message}.`}</Text>}
        {isTimeseriesError && <Text>{`Could not fetch telemetry data for ${station_id}: ${timeseriesError?.message}.`}</Text>}
      </View>
    );
  }

  let allTimeseries: Record<
    Variable | string,
    {
      dates: string[];
      data: number[];
      variable: VariableMetadata;
    }
  > = {};
  for (const station of timeseries.station_timeseries.STATION) {
    for (const variable in station.OBSERVATIONS) {
      if (variable === 'date_time') {
        continue;
      }
      allTimeseries[variable] = {
        dates: station.OBSERVATIONS['date_time'],
        data: station.OBSERVATIONS[variable],
        variable: timeseries.station_timeseries.VARIABLES[station.SOURCE][variable],
      };
    }
  }

  return (
    <ScrollView style={styles.view}>
      {Object.values(allTimeseries).map(item => (
        <TelemetryTimeseriesGraph key={item.variable.variable} dates={item.dates} data={item.data} variable={item.variable} />
      ))}
    </ScrollView>
  );
};

const TelemetryTimeseriesGraph: React.FunctionComponent<{
  dates: string[];
  data: number[];
  variable: VariableMetadata;
}> = ({dates, data, variable}) => {
  const {width} = useWindowDimensions();
  const points: DataPoint[] = dataPoints(dates, data);
  const values: number[] = points.map(i => i.datum);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const y = scaleLinear().domain([minValue, maxValue]).range([0, GRAPH_HEIGHT]);

  const parsedDates: Date[] = points.map(i => i.date);
  const start: Date = min(parsedDates);
  const end: Date = max(parsedDates);
  const x = scaleTime().domain([start, end]).range([0, width]);

  return (
    <View style={{flex: 1}}>
      <Text>{variable.variable}</Text>
      {
        // @ts-ignore Chart type doesn't have a definition for `children`
        // There's an unmerged pull request to address the issue:
        // https://github.com/xanderdeseyn/react-native-responsive-linechart/issues/166
        <Chart
          style={{height: GRAPH_HEIGHT, width: width}}
          xDomain={{min: x(start), max: x(end)}}
          yDomain={{min: y(minValue), max: y(maxValue)}}
          padding={{left: 40, top: 40, bottom: 40, right: 10}}>
          <VerticalAxis
            tickValues={y
              .nice()
              .ticks(5)
              .map(i => y(i))}
            theme={{labels: {formatter: v => y.invert(v).toFixed(2)}}}
          />
          <HorizontalAxis
            tickValues={x
              .nice()
              .ticks(5)
              .map(i => x(i))}
            theme={{labels: {formatter: v => format(x.invert(v), 'MM-dd HH:mm:SS')}}}
          />
          <Line data={points.map(point => ({x: x(point.date), y: y(point.datum)}))} smoothing={'cubic-spline'} />
        </Chart>
      }
    </View>
  );
};

interface DataPoint {
  date: Date;
  datum: number;
}

const dataPoints = (dates: string[], data: number[]): DataPoint[] => {
  let points: DataPoint[] = [];
  for (let i = 0; i < dates.length; i++) {
    points.push({
      date: parseISO(dates[i]),
      datum: data[i],
    });
  }
  return points;
};

const GRAPH_HEIGHT = 400;

const styles = StyleSheet.create({
  view: {
    ...StyleSheet.absoluteFillObject,
  },
});
