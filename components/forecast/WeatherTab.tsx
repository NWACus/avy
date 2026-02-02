import {CompositeNavigationProp, useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import {ActionList} from 'components/content/ActionList';
import {Card, CollapsibleCard} from 'components/content/Card';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {InternalError, NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {HStack, VStack, View} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySm, BodyXSmBlack, Title3Black, bodySmSize} from 'components/text';
import {HTML} from 'components/text/HTML';
import {NWACStationsByZone, ZoneWithWeatherStations} from 'components/weather_data/NWACWeatherStationList';
import helpStrings from 'content/helpStrings';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useMapLayer} from 'hooks/useMapLayer';
import {FormatTimeOfDay, useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {useRefresh} from 'hooks/useRefresh';
import {useWeatherForecast} from 'hooks/useWeatherForecast';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import {isArray} from 'lodash';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {RefreshControl, ScrollView} from 'react-native';
import {HomeStackParamList, TabNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {
  AvalancheCenterID,
  AvalancheForecastZone,
  AvalancheForecastZoneStatus,
  InlineWeatherData,
  ProductType,
  RowColumnWeatherData,
  Weather,
  WeatherDataLabel,
  WeatherDatum,
  WeatherPeriodLabel,
  WeatherStationSource,
} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTime, RequestedTimeString, formatRequestedTime, pacificDateToDayOfWeekString, parseRequestedTimeString, utcDateToLocalTimeString} from 'utils/date';

type ForecastNavigationProp = CompositeNavigationProp<NativeStackNavigationProp<HomeStackParamList, 'forecast'>, TabNavigationProps>;

interface WeatherTabProps {
  zone: AvalancheForecastZone;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
  forecast_zone_id: number;
}

const SmallHeaderWithTooltip: React.FunctionComponent<{
  title: string;
  content?: string | null;
  dialogTitle: string;
}> = ({title, content, dialogTitle}) => (
  // the icon style is designed to make the circle "i" look natural next to the
  // text - neither `center` nor `baseline` alignment look good on their own
  <HStack space={6} alignItems="center" justifyContent="space-between" width="100%">
    <BodyXSmBlack style={{flex: 1}}>{title}</BodyXSmBlack>
    {content && <InfoTooltip size={bodySmSize} title={dialogTitle || title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />}
  </HStack>
);

export const WeatherTab: React.FC<{
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  forecast_zone_id: number;
}> = ({center_id, requestedTime: requestedTimeString, forecast_zone_id}) => {
  const requestedTime = parseRequestedTimeString(requestedTimeString);
  const centerResult = useAvalancheCenterMetadata(center_id);
  const center = centerResult.data;

  if (incompleteQueryState(centerResult) || !center) {
    return <QueryState results={[centerResult]} />;
  }

  const zone: AvalancheForecastZone | undefined = center.zones.find(item => item.id === forecast_zone_id);
  if (!zone || zone.status === AvalancheForecastZoneStatus.Disabled) {
    const message = `Avalanche center ${center_id} had no zone with id ${forecast_zone_id}`;
    if (!zone) {
      // If the zone is intentionally disabled, don't log to Sentry
      Sentry.captureException(new Error(message));
    }
    return <NotFound what={[new NotFoundError(message, 'avalanche forecast zone')]} />;
  }

  if (center_id === 'NWAC') {
    return <NWACWeatherTab zone={zone} center_id={center_id} requestedTime={requestedTime} forecast_zone_id={forecast_zone_id} />;
  } else {
    return <NACWeatherTab zone={zone} center_id={center_id} requestedTime={requestedTime} forecast_zone_id={forecast_zone_id} />;
  }
};

export function adaptSierraWeatherForecast(input: Weather): Weather {
  for (let i = 0; i < input.weather_data.length; i++) {
    const datum = input.weather_data[i];
    if ('columns' in datum) {
      const weatherIndex = datum.rows?.findIndex(value => value.heading === 'Weather');
      if (
        // we have an index and such a row exists
        weatherIndex !== undefined &&
        datum.data &&
        weatherIndex <= datum.data.length &&
        datum.data[weatherIndex] &&
        // we have the same number of weather forecasts as periods
        datum.columns &&
        datum.columns.length === 1 &&
        datum.data[weatherIndex].length === datum.columns[0].length
      ) {
        for (let j = 0; j < datum.columns[0].length; j++) {
          const previousHeading = datum.columns[0][j].subheading;
          datum.columns[0][j].subheading = datum.data[weatherIndex][j].value || '';
          if (previousHeading !== '') {
            datum.columns[0][j].subheading = datum.columns[0][j].subheading + '\n\n' + previousHeading;
          }
        }
        datum.data.splice(weatherIndex, 1);
        datum.rows?.splice(weatherIndex, 1);
      }
    }
    input.weather_data[i] = datum;
  }
  return input;
}

export const NACWeatherTab: React.FC<WeatherTabProps> = ({zone, center_id, requestedTime, forecast_zone_id}) => {
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const avalancheForecastResult = useAvalancheForecast(center_id, forecast_zone_id, requestedTime, metadata);
  const avalancheForecast = avalancheForecastResult.data;
  const weatherForecastId = avalancheForecast
    ? avalancheForecast.product_type === ProductType.Forecast || avalancheForecast.product_type === ProductType.Summary
      ? avalancheForecast.weather_data?.weather_product_id
      : undefined
    : undefined;
  const weatherForecastResult = useWeatherForecast(weatherForecastId);
  const weatherForecast = weatherForecastResult.data;
  const {isRefreshing, refresh} = useRefresh(avalancheCenterMetadataResult.refetch, avalancheForecastResult.refetch, weatherForecastResult.refetch);
  const onRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id && zone.name) {
      postHog.screen('weatherForecastTab', {
        center: center_id,
        zone: zone.name,
      });
    }
  }, [postHog, center_id, zone.name]);
  useFocusEffect(recordAnalytics);

  if (incompleteQueryState(avalancheCenterMetadataResult, avalancheForecastResult) || !metadata || !avalancheForecast) {
    return <QueryState results={[avalancheCenterMetadataResult, avalancheForecastResult]} />;
  }

  if (!weatherForecastId) {
    return <NotFound terminal what={[new NotFoundError('no associated weather forecast', 'weather forecast')]} />;
  }

  if (incompleteQueryState(weatherForecastResult) || !weatherForecast) {
    return <QueryState results={[weatherForecastResult]} />;
  }

  const adaptedWeatherForecast = center_id === 'SAC' ? adaptSierraWeatherForecast(weatherForecast) : weatherForecast;

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      <VStack space={8} backgroundColor={colorLookup('primary.background')}>
        <Card borderRadius={0} borderColor="white" header={<Title3Black>Mountain Weather</Title3Black>}>
          <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Issued</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {utcDateToLocalTimeString(adaptedWeatherForecast.published_time)}
              </AllCapsSm>
            </VStack>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Author</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {adaptedWeatherForecast.author || 'Unknown'}
                {'\n'}
              </AllCapsSm>
            </VStack>
          </HStack>
        </Card>
        {adaptedWeatherForecast.weather_data &&
          adaptedWeatherForecast.weather_data.map(
            (item, i) =>
              zone.name === item.zone_name &&
              ('periods' in item ? <InlineWeatherForecast key={i} forecast={item} /> : <RowColumnWeatherForecast key={i} forecast={item} center_id={center_id} />),
          )}
        {adaptedWeatherForecast.weather_discussion && (
          <CollapsibleCard
            identifier={'weatherSynopsis'}
            marginTop={1}
            borderRadius={0}
            borderColor="white"
            header={<BodyBlack>Weather Discussion</BodyBlack>}
            startsCollapsed={false}>
            <HTML source={{html: adaptedWeatherForecast.weather_discussion}} />
          </CollapsibleCard>
        )}
        {/*// TODO: weather stations*/}
      </VStack>
    </ScrollView>
  );
};

export const NWACWeatherTab: React.FC<WeatherTabProps> = ({zone, center_id, requestedTime}) => {
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const nwacForecastResult = useNWACWeatherForecast(center_id, zone.id, requestedTime);
  const nwacForecast = nwacForecastResult.data;
  const mapLayerResult = useMapLayer(center_id);
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata(center_id, metadata?.widget_config.stations?.token);
  const weatherStations = weatherStationsResult.data;
  const [stationsByZone, setStationsByZone] = useState<ZoneWithWeatherStations[]>([]);
  const {isRefreshing, refresh} = useRefresh(nwacForecastResult.refetch, avalancheCenterMetadataResult.refetch, mapLayerResult.refetch);
  const onRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const navigation = useNavigation<ForecastNavigationProp>();
  useEffect(() => {
    if (metadata?.widget_config.stations?.token && weatherStations && mapLayer) {
      setStationsByZone(NWACStationsByZone(mapLayer, weatherStations));
    }
  }, [metadata, weatherStations, mapLayer]);

  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id && zone.name) {
      postHog.screen('weatherForecastTab', {
        center: center_id,
        zone: zone.name,
      });
    }
  }, [postHog, center_id, zone.name]);
  useFocusEffect(recordAnalytics);

  // In the UI, we show weather station groups, which may contain 1 or more weather stations.
  // Example: Alpental Ski Area shows 3 weather stations.
  const actionListData = useMemo(
    () =>
      Object.entries(stationsByZone?.find(zoneData => zoneData.feature.id === zone.id)?.stationGroups || {})
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, stations]) => ({
          label: name,
          data: stations,
          action: () => {
            navigation.navigate('stationsDetail', {
              center_id: center_id,
              stations: stations
                .map(s => ({id: s.stid, source: s.source}))
                .reduce(
                  (accum, value) => {
                    accum[value.id] = value.source;
                    return accum;
                  },
                  {} as Record<string, WeatherStationSource>,
                ),
              name: name,
              requestedTime: formatRequestedTime(requestedTime),
              zoneName: zone.name,
            });
          },
        })),
    [center_id, stationsByZone, navigation, requestedTime, zone.name, zone.id],
  );

  if (incompleteQueryState(avalancheCenterMetadataResult, mapLayerResult) || !metadata || !mapLayer) {
    return <QueryState results={[nwacForecastResult, avalancheCenterMetadataResult, mapLayerResult]} />;
  }

  if (metadata?.widget_config.stations?.token) {
    if (incompleteQueryState(weatherStationsResult) || !weatherStations) {
      return (
        <QueryState
          results={[weatherStationsResult]}
          terminal
          customMessage={{
            notFound: () => ({
              headline: 'Missing forecast',
              body: 'There may not be a forecast available for today.',
            }),
          }}
        />
      );
    }
  }

  if (incompleteQueryState(nwacForecastResult) || !nwacForecast || nwacForecast === 'ignore') {
    return (
      <QueryState
        results={[nwacForecastResult]}
        terminal
        customMessage={{
          notFound: () => ({
            headline: 'Missing forecast',
            body: 'There may not be a forecast available for today.',
          }),
        }}
      />
    );
  }

  const author = `${nwacForecast.forecaster.first_name} ${nwacForecast.forecaster.last_name}`;

  const num_periods = nwacForecast.periods.length;
  const num_forecasts_match = nwacForecast.weather_forecasts.length !== num_periods;
  const num_periods_even = num_periods % 2 !== 0;
  const num_sub_periods_multiple = nwacForecast.sub_periods.length !== 2 * num_periods;
  const num_5k_temps_match = nwacForecast.five_thousand_foot_temperatures.length !== num_periods;
  if (num_periods_even || num_sub_periods_multiple || num_forecasts_match || num_5k_temps_match) {
    Sentry.captureException(
      new Error(
        `Assumptions not met on NWAC weather forecast for zone ${zone.id} at time ${requestedTime.toString()}: ${JSON.stringify({
          num_periods_even,
          num_sub_periods_multiple,
          num_forecasts_match,
          num_5k_temps_match,
        })}`,
      ),
    );
    return <InternalError />;
  }
  for (let i = 0; i < nwacForecast.precipitation_by_location.length; i++) {
    const l = nwacForecast.precipitation_by_location[i];
    if (l.precipitation.length !== num_periods) {
      Sentry.captureException(
        new Error(
          `Assumptions not met on NWAC weather forecast for zone ${
            zone.id
          } at time ${requestedTime.toString()}: forecast.precipitation_by_location[${i}].precipitation[] has length ${l.precipitation.length}, not ${num_periods}`,
        ),
      );
      return <InternalError />;
    }
  }

  // now we know we have some multiple of 2 forecasts and twice that many periods
  const nwacPeriodData = nwacForecast.sub_periods.map((period, index) => ({
    period: period.toLowerCase(),
    snow_level: nwacForecast.snow_levels[index].elevation,
    ridgeline_winds: nwacForecast.ridgeline_winds[index],
  }));
  const nwacForecasts = nwacForecast.weather_forecasts.map((f, i) => ({
    title: `${pacificDateToDayOfWeekString(f.date)} ${FormatTimeOfDay(f.time_of_day)}`,
    description: f.description,
    five_thousand_foot_temperatures: nwacForecast.five_thousand_foot_temperatures[i],
    precipitation: nwacForecast.precipitation_by_location.map(l => ({
      name: l.name,
      value: l.precipitation[i].value,
    })),
    snow_levels: nwacPeriodData.slice(2 * i, 2 * (i + 1)).map(p => ({
      period: p.period,
      level: p.snow_level,
    })),
    ridgeline_winds: nwacPeriodData.slice(2 * i, 2 * (i + 1)).map(p => ({
      period: p.period,
      direction: p.ridgeline_winds.direction,
      speed: p.ridgeline_winds.speed,
    })),
  }));

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      <VStack space={8} backgroundColor={colorLookup('primary.background')}>
        <Card borderRadius={0} borderColor="white" header={<Title3Black>Mountain Weather</Title3Black>} noDivider>
          <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Issued</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {utcDateToLocalTimeString(nwacForecast.mountain_weather_forecast.publish_date)}
              </AllCapsSm>
            </VStack>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Author</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {author || 'Unknown'}
                {'\n'}
              </AllCapsSm>
            </VStack>
          </HStack>
        </Card>
        {nwacForecasts.map((f, index) => (
          <Card
            borderRadius={0}
            borderColor="white"
            noDivider
            key={index}
            header={
              <VStack space={2} key={index}>
                <BodyBlack>{f.title}</BodyBlack>
                <Body>{f.description}</Body>
              </VStack>
            }
            noInternalSpace>
            <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} mt={12}>
              <HStack justifyContent="space-between" alignItems="stretch" borderBottomWidth={1} borderColor={colorLookup('light.300')}>
                <VStack flexBasis={0.5} flex={1} m={12}>
                  <SmallHeaderWithTooltip title="5K ft Temps (°F)" dialogTitle="Temperature" content={helpStrings.weather.temperature} />
                  <BodySm color={colorLookup('text.secondary')}>
                    {f.five_thousand_foot_temperatures.max} (max) / {f.five_thousand_foot_temperatures.min} (min)
                  </BodySm>
                </VStack>
                <View width={1} height="100%" bg={colorLookup('light.300')} flex={0} />
                <VStack flexBasis={0.5} flex={1} m={12}>
                  <SmallHeaderWithTooltip title="Snow Level (ft)" dialogTitle="Snow Level" content={helpStrings.weather.snowLevelNoAsterisk} />
                  {f.snow_levels.map(({level, period}, lindex) => (
                    <BodySm color={colorLookup('text.secondary')} key={`forecast-${index}-snow-level-${lindex}`}>
                      {Intl.NumberFormat().format(level)} {period}
                    </BodySm>
                  ))}
                </VStack>
              </HStack>
              <HStack justifyContent="space-between" alignItems="flex-start">
                <VStack flexBasis={0.5} flex={1} m={12}>
                  <SmallHeaderWithTooltip title="Precipitation (in)" dialogTitle="Precipitation" content={helpStrings.weather.precipitation} />
                  {f.precipitation.map(({name, value}) => (
                    <HStack key={name} justifyContent="space-between" alignItems="flex-start" alignSelf="stretch">
                      <View flex={1} flexGrow={2} pr={12}>
                        <BodySm color={colorLookup('text.secondary')} style={{flex: 1, flexBasis: 0.75}}>
                          {name}
                        </BodySm>
                      </View>
                      <View flex={1} flexGrow={1}>
                        <BodySm color={colorLookup('text.secondary')} textAlign="right">
                          {value}
                        </BodySm>
                      </View>
                    </HStack>
                  ))}
                </VStack>
                <View width={1} height="100%" bg={colorLookup('light.300')} flex={0} />
                <VStack flexBasis={0.5} flex={1} m={12}>
                  <SmallHeaderWithTooltip title="Ridgeline Winds (mph)" dialogTitle="Ridgeline Winds" content={helpStrings.weather.wind} />
                  {f.ridgeline_winds.map(({direction, speed, period}, lindex) => (
                    <BodySm color={colorLookup('text.secondary')} key={`forecast-${index}-winds-${lindex}`}>
                      {direction} {speed} {period}
                    </BodySm>
                  ))}
                </VStack>
              </HStack>
            </View>
          </Card>
        ))}
        {actionListData.length > 0 && <ActionList pl={16} backgroundColor="white" header={<Title3Black>Weather Data</Title3Black>} actions={actionListData} />}
        <CollapsibleCard
          identifier={'weatherSynopsis'}
          marginTop={1}
          borderRadius={0}
          borderColor="white"
          header={<Title3Black>Weather Synopsis</Title3Black>}
          startsCollapsed={true}>
          <HTML source={{html: nwacForecast.mountain_weather_forecast.synopsis_day1_day2}} />
        </CollapsibleCard>
        {nwacForecast.mountain_weather_forecast.extended_synopsis && (
          <CollapsibleCard
            identifier={'weatherExtendedSynopsis'}
            marginTop={1}
            borderRadius={0}
            borderColor="white"
            header={<Title3Black>Extended Synopsis</Title3Black>}
            startsCollapsed={true}>
            <HTML source={{html: nwacForecast.mountain_weather_forecast.extended_synopsis}} />
          </CollapsibleCard>
        )}
        <Card
          marginTop={1}
          borderRadius={0}
          borderColor="white"
          header={<HTML source={{html: nwacForecast.mountain_weather_forecast.special_header_notes}} />}
          noDivider
          noInternalSpace
        />
      </VStack>
    </ScrollView>
  );
};

interface period {
  meta: WeatherPeriodLabel;
  data: labeledData[];
}

interface labeledData {
  label?: string;
  data: datum[];
}

interface datum {
  label: WeatherDataLabel;
  items: WeatherDatum[];
}

const InlineWeatherForecast: React.FunctionComponent<{forecast: InlineWeatherData}> = ({forecast}) => {
  for (const datum of forecast.data) {
    if (datum.values.length != forecast.periods.length) {
      Sentry.captureException(`zone ${forecast.zone_name}: found ${forecast.periods.length} forecast periods but only ${datum.values.length} datums, cannot display forecast`);
      return <InternalError inline />;
    }
  }

  const periods: period[] = [];
  for (let i = 0; i < forecast.periods.length; i++) {
    const data: datum[] = [];
    for (const field of forecast.data) {
      const items: WeatherDatum[] = [];
      const dataItem = field.values[i];
      if (isArray(dataItem)) {
        for (const subItem of dataItem) {
          items.push({
            prefix: subItem.label,
            value: subItem.value,
          });
        }
      } else {
        items.push({
          value: dataItem,
        });
      }
      data.push({
        label: {
          heading: field.field,
          unit: field.unit,
          options: [],
          field: '',
        },
        items: items,
      });
    }
    periods.push({
      meta: {
        heading: forecast.periods[i],
        width: 0,
      },
      data: [{data: data}],
    });
  }
  return <ForecastPeriod periods={periods} />;
};

const RowColumnWeatherForecast: React.FunctionComponent<{
  forecast: RowColumnWeatherData;
  center_id: AvalancheCenterID;
}> = ({forecast, center_id}) => {
  if (center_id === 'BTAC' && forecast.zone_id !== 'snake_river_range') {
    return <BTACWeatherForecast forecast={forecast} />;
  }

  let periods: period[] = [];
  try {
    periods = periodsForForecast(forecast);
  } catch (e) {
    Sentry.captureException(e, {tags: {center_id: center_id, zone_id: forecast.zone_id}});
    return <InternalError inline />;
  }

  return <ForecastPeriod periods={periods} />;
};

const periodsForForecast = (forecast: RowColumnWeatherData, label?: string): period[] => {
  if (!forecast.columns || forecast.columns.length < 1 || !forecast.columns[0] || forecast.columns[0].length < 1) {
    const columns = forecast.columns ? forecast.columns.length : 0;
    throw new Error(
      `invalid assumptions: have ${columns} columns, first column has ${columns && forecast.columns && forecast.columns[0] ? forecast.columns[0].length : 0} entries`,
    );
  }
  if (!forecast.data || !forecast.rows || forecast.data.length !== forecast.rows.length) {
    throw new Error(`invalid assumptions: have ${forecast.data ? forecast.data.length : 0} periods, ${forecast.rows ? forecast.rows.length : 0} rows`);
  }

  const periods: period[] = [];
  let currentSpan = 0;
  for (const column of forecast.columns[0]) {
    const colSpan = column.colspan ?? 1;
    const data: datum[] = [];
    for (let r = 0; r < forecast.rows.length; r++) {
      const label = forecast.rows[r];
      const row = forecast.data[r];
      const items: WeatherDatum[] = [];
      let thisSpan = 0;
      for (let i = 0; i < row.length; i++) {
        thisSpan += row[i].colspan ? Number(row[i].colspan) : 1;
        if (currentSpan < thisSpan && thisSpan <= currentSpan + colSpan) {
          items.push(row[i]);
        }
      }
      if (items.length > 0) {
        data.push({
          label: label,
          items: items,
        });
      }
    }
    currentSpan += colSpan;
    if (data.length > 0) {
      periods.push({
        meta: column,
        data: [{label: label, data: data}],
      });
    }
  }

  return periods;
};

const ForecastPeriod: React.FunctionComponent<{periods: period[]}> = ({periods}) => {
  return (
    <>
      {periods.map((period, index) => (
        <Card
          borderRadius={0}
          borderColor="white"
          noDivider
          key={index}
          header={
            <VStack space={2} key={index}>
              <BodyBlack>{period.meta.heading}</BodyBlack>
              {period.meta.subheading && <Body>{period.meta.subheading}</Body>}
            </VStack>
          }
          noInternalSpace>
          {period.data.map((data, dataIndex) => (
            <VStack space={2} key={`${index}-${dataIndex}`} py={12}>
              {data.label && <Body>{data.label}</Body>}
              <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} mt={12}>
                {data.data.map(
                  (item, periodIndex) =>
                    periodIndex % 2 === 0 && (
                      <HStack
                        key={`${index}-${dataIndex}-${periodIndex}`}
                        justifyContent="space-between"
                        alignItems="stretch"
                        borderBottomWidth={periodIndex < data.data.length - 2 ? 1 : 0}
                        borderColor={colorLookup('light.300')}>
                        <VStack flexBasis={0.5} flex={1} m={12}>
                          <ForecastValue forecastItem={item} />
                        </VStack>
                        <View width={1} height="100%" bg={colorLookup('light.300')} flex={0} />
                        <VStack flexBasis={0.5} flex={1} m={12}>
                          {periodIndex + 1 < data.data.length && <ForecastValue forecastItem={data.data[periodIndex + 1]} />}
                        </VStack>
                      </HStack>
                    ),
                )}
              </View>
            </VStack>
          ))}
        </Card>
      ))}
    </>
  );
};

const ForecastValue: React.FunctionComponent<{forecastItem: datum}> = ({forecastItem}) => {
  return (
    <>
      <SmallHeaderWithTooltip title={forecastItem.label.heading} dialogTitle={forecastItem.label.heading} content={forecastItem.label.help} />
      {forecastItem.items.map((item, key) => (
        <BodySm key={key} color={colorLookup('text.secondary')}>
          {item.value ? `${item.prefix ? item.prefix + ' ' : ''}${item.value}${forecastItem.label.unit ? ' ' + forecastItem.label.unit : ''}` : '-'}
        </BodySm>
      ))}
    </>
  );
};

export const BTACWeatherForecast: React.FunctionComponent<{forecast: RowColumnWeatherData}> = ({forecast}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  // n.b. we can't factor this check into a separate method as tsc is not smart enough to do type narrowing then
  if (!forecast.columns || forecast.columns.length < 1 || !forecast.columns[0] || forecast.columns[0].length < 1) {
    const columns = forecast.columns ? forecast.columns.length : 0;
    const error = `invalid assumptions: have ${columns} columns, first column has ${columns && forecast.columns && forecast.columns[0] ? forecast.columns[0].length : 0} entries`;
    logger.error(error);
    Sentry.captureException(error, {tags: {center_id: 'BTAC', zone_id: forecast.zone_id}});
    return <InternalError inline />;
  }
  if (!forecast.data || !forecast.rows || forecast.data.length !== forecast.rows.length) {
    const error = `invalid assumptions: have ${forecast.data ? forecast.data.length : 0} periods, ${forecast.rows ? forecast.rows.length : 0} rows`;
    logger.error(error);
    Sentry.captureException(error, {
      tags: {
        center_id: 'BTAC',
        zone_id: forecast.zone_id,
      },
    });
    return <InternalError inline />;
  }

  // determine the location
  if (!forecast.rows || forecast.rows.length === 0 || !forecast.rows[0].style || !forecast.rows[0].style.includes('background-color')) {
    const row = forecast.rows && forecast.rows.length >= 0 ? forecast.rows[0] : {};
    const style = row && 'style' in row ? row.style : '';
    const error = `invalid assumptions: first forecast row style doesn't contain background color, got row ${JSON.stringify(row)}, style ${style as string}`;
    logger.error(error);
    Sentry.captureException(error, {
      tags: {
        center_id: 'BTAC',
        zone_id: forecast.zone_id,
      },
    });
    return <InternalError inline />;
  }
  const location = forecast.rows[0].heading;

  const weatherSynopsisRow = forecast.rows.findIndex(value => value.heading === 'Weather Synopsis');
  const sweRow = forecast.rows.findIndex(value => value.heading === 'Snowfall/Snow Water Equivalent');
  const snowRow = forecast.rows.findIndex(value => value.heading === 'Seasonal Snow');

  if (weatherSynopsisRow === undefined || sweRow === undefined || snowRow === undefined || !(weatherSynopsisRow < sweRow) || !(sweRow < snowRow)) {
    const error = `invalid assumptions: rows out of order, expected weatherSynopsis < swe < snow, got weatherSynopsis: ${weatherSynopsisRow}, swe: ${sweRow}, snow: ${snowRow}`;
    logger.error(error);
    Sentry.captureException(error, {
      tags: {
        center_id: 'BTAC',
        zone_id: forecast.zone_id,
      },
    });
    return <InternalError inline />;
  }

  // collect the weather forecast data
  const weatherForecast: RowColumnWeatherData = {
    columns: forecast.columns,
    rows: forecast.rows.slice(1, weatherSynopsisRow),
    data: forecast.data.slice(1, weatherSynopsisRow),
    zone_id: forecast.zone_id,
    zone_name: forecast.zone_name,
  };
  const weatherPeriods = periodsForForecast(weatherForecast, `Weather at ${location}`);

  // collect the SWE data
  const sweForecast: RowColumnWeatherData = {
    columns: forecast.columns,
    rows: forecast.rows.slice(sweRow + 1, snowRow),
    data: forecast.data.slice(sweRow + 1, snowRow),
    zone_id: forecast.zone_id,
    zone_name: forecast.zone_name,
  };
  const swePeriods = periodsForForecast(sweForecast, `${forecast.rows[sweRow].heading}`);

  // aggregate the periods
  const periods: period[] = [];
  for (const p of weatherPeriods) {
    const collection: labeledData[] = [];

    const weather = weatherPeriods.find(i => i.meta.heading === p.meta.heading);
    if (weather) {
      collection.push(...weather.data);
    }

    const swe = swePeriods.find(i => i.meta.heading === p.meta.heading);
    if (swe) {
      collection.push(...swe.data);
    }
    periods.push({
      meta: p.meta,
      data: collection,
    });
  }

  // collect seasonal snow
  const snowData: labeledData[] = [];
  for (const [index, item] of forecast.data[snowRow].entries()) {
    if (item.value) {
      const values: datum[] = [];
      for (let i = snowRow + 1; i < forecast.data.length; i++) {
        if (index >= forecast.data[i].length) {
          return <InternalError inline />;
        }
        values.push({
          label: forecast.rows[i],
          items: [forecast.data[i][index]],
        });
      }
      snowData.push({
        label: item.value,
        data: values,
      });
    }
  }
  const snow: period = {
    meta: {
      heading: forecast.rows[snowRow].heading,
      width: 0,
    },
    data: snowData,
  };

  return (
    <>
      <CollapsibleCard
        identifier={'btacWeatherSynopsis'}
        marginTop={1}
        borderRadius={0}
        borderColor="white"
        header={<BodyBlack>Weather Discussion</BodyBlack>}
        startsCollapsed={false}>
        <Body>{forecast.data[weatherSynopsisRow][0].value}</Body>
      </CollapsibleCard>
      <ForecastPeriod periods={periods} />
      <ForecastPeriod periods={[snow]} />
    </>
  );
};
