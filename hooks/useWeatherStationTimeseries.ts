import {useContext} from 'react';

import {useQuery, useQueryClient} from 'react-query';

import {ClientContext, ClientProps} from 'clientContext';
import {ApiError, OpenAPI, StationMetadata, TimeseriesDataService} from 'types/generated/snowbound';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import AvalancheCenterMetadata from 'hooks/useAvalancheCenterMetadata';

type Source = 'nwac' | 'snotel' | 'mesowest';

interface Props {
  center: AvalancheCenterID;
  stids: string[];
  sources: Source[];
  startDate: Date;
  endDate: Date;
}

type Variable =
  | 'wind_speed'
  | 'relative_humidity'
  | 'precip_accum'
  | 'wind_gust'
  | 'snow_depth'
  | 'snow_water_equiv'
  | 'pressure'
  | 'precip_accum_one_hour'
  | 'equip_temperature'
  | 'snow_depth_24h'
  | 'intermittent_snow'
  | 'wind_speed_min'
  | 'air_temp'
  | 'net_solar'
  | 'wind_direction'
  | 'solar_radiation';

interface VariableDescriptor {
  variable: Variable;
  long_name: string;
  default_unit: string;
  english_unit: string;
  metric_unit: string;
  rounding: number; // is this really a bool? or is it a place signifier? no idea
}

interface Observations extends Record<Variable, number[] | null[]> {
  date_time: string[];
}

interface Station extends StationMetadata {
  observations: Observations;
}

interface TimeSeries {
  UNITS: Record<string, string>;
  VARIABLES: VariableDescriptor[];
  STATION: Station[];
}

export const useWeatherStationTimeseries = ({center, sources, stids, startDate, endDate}: Props) => {
  const queryClient = useQueryClient();
  const clientProps = useContext<ClientProps>(ClientContext);
  const sourceString = sources.join(',');
  const stidString = stids.join(',');

  return useQuery<TimeSeries, ApiError | Error>(
    ['timeseries', center, sourceString, stidString, startDate.toISOString(), endDate.toISOString()],
    async () => {
      console.log('starting ');
      // Get the snowbound API token for the center
      const metadata = await AvalancheCenterMetadata.fetchQuery(queryClient, clientProps.nationalAvalancheCenterHost, center);
      const token = metadata.widget_config.stations.token;

      OpenAPI.BASE = clientProps.snowboundHost;
      console.log('fetching ');
      const timeseries = await TimeseriesDataService.getStationDataTimeseriesWxV1StationDataTimeseriesGet({
        source: sourceString,
        stid: stidString,
        startDate: '202301210000',
        endDate: '202301210300',
        //     startDate: 'tbd',
        // endDate: 'tbd',
        output: 'mesowest',
        token,
      });
      console.log('fetch complete ', JSON.stringify(timeseries, null, 2));

      // TODO: filter out columns where there's just no data?
      return timeseries;
    },
    // {
    //   // TODO: figure out sane cache policy here. Probably don't want to keep this in memory forever.
    //   // staleTime: 24 * 60 * 60 * 1000, // don't bother re-fetching for one day (in milliseconds)
    //   // cacheTime: 5 * 60 * 1000,
    // },
  );
};
