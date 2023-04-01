import React, {useContext} from 'react';

import {useQuery} from '@tanstack/react-query';

import {ClientContext, ClientProps} from 'clientContext';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {ApiError, OpenAPI, StationMetadata, TimeseriesDataService} from 'types/generated/snowbound';
import {EnglishUnit, MetricUnit, Unit, Variable} from 'types/snowbound';
import {toSnowboundStringUTC} from 'utils/date';

type Source = 'nwac' | 'snotel' | 'mesowest';

interface Props {
  token: string;
  stids: string[];
  sources: Source[];
  startDate: Date;
  endDate: Date;
}

interface VariableDescriptor {
  variable: Variable;
  long_name: string;
  default_unit: Unit;
  english_unit: EnglishUnit;
  metric_unit: MetricUnit;
  rounding: number; // is this really a bool? looks like it's always 0 or 1 in limited testing. or is it a place signifier? no idea
}

type Observations = Record<Variable, number[] | null[]> & {
  date_time: string[];
};

interface Station extends StationMetadata {
  observations: Observations;
}

export interface TimeSeries {
  UNITS: Record<string, string>;
  VARIABLES: VariableDescriptor[];
  STATION: Station[];
}

function floorToHour(date: Date) {
  const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
  return new Date(Math.floor(date.getTime() / MILLISECONDS_PER_HOUR) * MILLISECONDS_PER_HOUR);
}

export const useWeatherStationTimeseries = ({token, sources, stids, startDate, endDate}: Props) => {
  const clientProps = useContext<ClientProps>(ClientContext);
  const sourceString = sources.join(',');
  const stidString = stids.join(',');
  // TODO(skuznets): make this distinguish latest from a real range, and on latest the cache key doesn't hold on to the date, but we send it
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = ['timeseries', {source: sourceString, station: stidString, start: toSnowboundStringUTC(floorToHour(startDate)), end: toSnowboundStringUTC(floorToHour(endDate))}];
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  return useQuery<TimeSeries, ApiError | Error>(
    key,
    async () => {
      OpenAPI.BASE = clientProps.snowboundHost;
      return TimeseriesDataService.getStationDataTimeseriesWxV1StationDataTimeseriesGet({
        source: sourceString,
        stid: stidString,
        startDate: toSnowboundStringUTC(floorToHour(startDate)),
        endDate: toSnowboundStringUTC(floorToHour(endDate)),
        output: 'mesowest',
        token,
      });
    },
    {
      staleTime: 60 * 60 * 1000, // don't bother re-fetching for one hour (in milliseconds)
      cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
      enabled: !!token,
    },
  );
};
