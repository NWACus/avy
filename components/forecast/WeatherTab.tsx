import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ActionList} from 'components/content/ActionList';
import {Card, CollapsibleCard} from 'components/content/Card';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {InternalError, NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {HStack, VStack, View} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySm, BodyXSmBlack, Title3Black, bodyXSmSize} from 'components/text';
import {HTML} from 'components/text/HTML';
import {NWACStationsByZone, ZoneWithWeatherStations} from 'components/weather_data/NWACWeatherStationList';
import helpStrings from 'content/helpStrings';
import {add, formatDistanceToNow, isAfter} from 'date-fns';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useAvalancheForecast} from 'hooks/useAvalancheForecast';
import {useMapLayer} from 'hooks/useMapLayer';
import {FormatTimeOfDay, useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {useRefresh} from 'hooks/useRefresh';
import {useWeatherForecast} from 'hooks/useWeatherForecast';
import {useWeatherStationsMetadata} from 'hooks/useWeatherStationsMetadata';
import {isArray} from 'lodash';
import {LoggerContext, LoggerProps} from 'loggerContext';
import React, {useEffect} from 'react';
import {RefreshControl, ScrollView} from 'react-native';
import Toast from 'react-native-toast-message';
import {HomeStackParamList, TabNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {
  AvalancheCenterID,
  AvalancheForecastZone,
  InlineWeatherData,
  ProductType,
  RowColumnWeatherData,
  WeatherDataLabel,
  WeatherDatum,
  WeatherPeriodLabel,
  WeatherStationSource,
} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTime, formatRequestedTime, pacificDateToDayOfWeekString, utcDateToLocalTimeString} from 'utils/date';

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
    {content && <InfoTooltip size={bodyXSmSize} title={dialogTitle || title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />}
  </HStack>
);

export const WeatherTab: React.FC<WeatherTabProps> = ({zone, center_id, requestedTime, forecast_zone_id}) => {
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const nwacForecastResult = useNWACWeatherForecast(center_id, zone.id, requestedTime);
  const nwacForecast = nwacForecastResult.data;
  const avalancheForecastResult = useAvalancheForecast(center_id, forecast_zone_id, requestedTime, metadata);
  const avalancheForecast = avalancheForecastResult.data;
  const weatherForecastId = avalancheForecast
    ? avalancheForecast.product_type === ProductType.Forecast || avalancheForecast.product_type === ProductType.Summary
      ? avalancheForecast.weather_data?.weather_product_id
      : undefined
    : undefined;
  const weatherForecastResult = useWeatherForecast(weatherForecastId);
  const weatherForecast = weatherForecastResult.data;
  const mapLayerResult = useMapLayer(center_id);
  const mapLayer = mapLayerResult.data;
  const weatherStationsResult = useWeatherStationsMetadata(center_id, metadata?.widget_config.stations?.token);
  const weatherStations = weatherStationsResult.data;
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const stationsByZone: ZoneWithWeatherStations[] = [];
  const {isRefreshing, refresh} = useRefresh(
    nwacForecastResult.refetch,
    avalancheCenterMetadataResult.refetch,
    mapLayerResult.refetch,
    avalancheForecastResult.refetch,
    weatherForecastResult.refetch,
  );

  const navigation = useNavigation<ForecastNavigationProp>();
  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      Toast.hide();
    });
  }, [navigation]);

  const [expiresTime, setExpiresTime] = React.useState<Date | null>(null);

  useEffect(() => {
    if (nwacForecast && nwacForecast !== 'ignore') {
      // Infer an expiration date. Morning forecasts expire at 2 pm Pacific the same day, afternoon forecasts at 7 am PST the next day
      // Let's say a morning forecast has to be published between midnight and noon Pacific, while an afternoon forecast can be published between noon and midnight Pacific.
      const published_time = new Date(nwacForecast.mountain_weather_forecast.publish_date);
      const publishHourUTC = published_time.getUTCHours();
      // getTimezoneOffset('PST') = -28800000, but returns NaN on Android due to missing Intl data. I'm just hard-coding a workaround here
      const offsetHours = -28800000 / 1000 / 60 / 60;
      // Deal with underflow when publishHourUTC + offsetHours goes negative
      const publishHourLocal = (publishHourUTC + offsetHours + 24) % 24;
      const isPublishedMorning = publishHourLocal < 12;
      const start = new Date(Date.UTC(published_time.getUTCFullYear(), published_time.getUTCMonth(), published_time.getUTCDate()));
      // 😵‍💫 😵‍💫 😵‍💫
      const expires_time = isPublishedMorning ? add(start, {hours: 14 - offsetHours}) : add(start, {hours: 7 - offsetHours, days: 1});
      setExpiresTime(expires_time);
    }
  }, [nwacForecast]);

  useEffect(() => {
    if (expiresTime && isAfter(new Date(), expiresTime)) {
      Toast.show({
        type: 'error',
        text1: `This weather forecast expired ${formatDistanceToNow(expiresTime)} ago.`,
        autoHide: false,
        position: 'bottom',
        onPress: () => Toast.hide(),
      });
    }
  }, [expiresTime]);

  if (incompleteQueryState(avalancheCenterMetadataResult, mapLayerResult, avalancheForecastResult) || !metadata || !mapLayer || !avalancheForecast) {
    return <QueryState results={[nwacForecastResult, avalancheCenterMetadataResult, mapLayerResult, avalancheForecastResult]} />;
  }

  if (center_id !== 'NWAC') {
    if (!weatherForecastId) {
      return <NotFound terminal what={[new NotFoundError('no associated weather forecast', 'weather forecast')]} />;
    }

    if (incompleteQueryState(weatherForecastResult) || !weatherForecast) {
      return <QueryState results={[weatherForecastResult]} />;
    }

    return (
      <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh} />}>
        <VStack space={8} backgroundColor={colorLookup('background.base')}>
          <Card borderRadius={0} borderColor="white" header={<Title3Black>Weather Forecast</Title3Black>}>
            <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
              <VStack space={8} style={{flex: 1}}>
                <AllCapsSmBlack>Issued</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {utcDateToLocalTimeString(weatherForecast.published_time)}
                </AllCapsSm>
              </VStack>
              <VStack space={8} style={{flex: 1}}>
                <AllCapsSmBlack>Author</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {weatherForecast.author || 'Unknown'}
                  {'\n'}
                </AllCapsSm>
              </VStack>
            </HStack>
            {weatherForecast.weather_data && (
              <VStack alignItems="stretch" pt={4}>
                {weatherForecast.weather_data.map(
                  (item, i) =>
                    zone.name === item.zone_name && ('periods' in item ? <InlineWeatherForecast key={i} forecast={item} /> : <RowColumnWeatherForecast key={i} forecast={item} />),
                )}
              </VStack>
            )}
            {weatherForecast.weather_discussion && (
              <VStack space={2} py={12} borderBottomWidth={1} borderColor={colorLookup('light.300')}>
                <BodyBlack>Weather Discussion</BodyBlack>
                <HTML source={{html: weatherForecast.weather_discussion}} />
              </VStack>
            )}
          </Card>
          {/*// TODO: weather stations*/}
        </VStack>
      </ScrollView>
    );
  }

  if (metadata?.widget_config.stations?.token) {
    if (incompleteQueryState(weatherStationsResult) || !weatherStations) {
      return <QueryState results={[weatherStationsResult]} />;
    } else {
      stationsByZone.push(...NWACStationsByZone(mapLayer, weatherStations, logger));
    }
  }

  if (incompleteQueryState(nwacForecastResult) || !nwacForecast || nwacForecast === 'ignore') {
    return <QueryState results={[nwacForecastResult]} />;
  }

  // In the UI, we show weather station groups, which may contain 1 or more weather stations.
  // Example: Alpental Ski Area shows 3 weather stations.
  const groupedWeatherStations = Object.entries(stationsByZone?.find(zoneData => zoneData.feature.id === zone.id)?.stationGroups || {}).sort((a, b) => a[0].localeCompare(b[0]));

  const author = `${nwacForecast.forecaster.first_name} ${nwacForecast.forecaster.last_name}`;

  // we are guaranteed to get some multiple of 2 forecasts and twice that many periods
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
    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh} />}>
      <VStack space={8} backgroundColor={colorLookup('background.base')}>
        <Card borderRadius={0} borderColor="white" header={<Title3Black>Weather Forecast</Title3Black>}>
          <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Issued</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {utcDateToLocalTimeString(nwacForecast.mountain_weather_forecast.publish_date)}
              </AllCapsSm>
            </VStack>
            <VStack space={8} style={{flex: 1}}>
              <AllCapsSmBlack>Expires</AllCapsSmBlack>
              <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                {utcDateToLocalTimeString(expiresTime)}
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
          <VStack alignItems="stretch" pt={4}>
            {nwacForecasts.map((f, index) => (
              <VStack space={2} key={index} py={12} borderBottomWidth={1} borderColor={index === 0 ? colorLookup('light.300') : 'white'}>
                <BodyBlack>{f.title}</BodyBlack>
                <Body>{f.description}</Body>
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
              </VStack>
            ))}
          </VStack>
        </Card>
        <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Weather Data</Title3Black>}>
          <VStack>
            {groupedWeatherStations.length > 0 && (
              <ActionList
                actions={groupedWeatherStations.map(([name, stations]) => ({
                  label: name,
                  data: stations,
                  action: () => {
                    navigation.navigate('stationsDetail', {
                      center_id: center_id,
                      stations: stations
                        .map(s => ({id: s.stid, source: s.source}))
                        .reduce((accum, value) => {
                          accum[value.id] = value.source;
                          return accum;
                        }, {} as Record<string, WeatherStationSource>),
                      name: name,
                      requestedTime: formatRequestedTime(requestedTime),
                      zoneName: zone.name,
                    });
                  },
                }))}
              />
            )}
            {groupedWeatherStations.length === 0 && (
              <HStack py={6}>
                <Body>No weather stations in this zone.</Body>
              </HStack>
            )}
          </VStack>
        </Card>
        <CollapsibleCard marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Weather Synopsis</Title3Black>} startsCollapsed={true}>
          <HTML source={{html: nwacForecast.mountain_weather_forecast.synopsis_day1_day2}} />
        </CollapsibleCard>
        <CollapsibleCard marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Extended Synopsis</Title3Black>} startsCollapsed={true}>
          <HTML source={{html: nwacForecast.mountain_weather_forecast.extended_synopsis}} />
        </CollapsibleCard>
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
  data: datum[];
}

interface datum {
  label: WeatherDataLabel;
  items: WeatherDatum[];
}

const InlineWeatherForecast: React.FunctionComponent<{forecast: InlineWeatherData}> = ({forecast}) => {
  for (const datum of forecast.data) {
    if (datum.values.length != forecast.periods.length) {
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
      data: data,
    });
  }
  return <ForecastPeriod periods={periods} />;
};

const RowColumnWeatherForecast: React.FunctionComponent<{forecast: RowColumnWeatherData}> = ({forecast}) => {
  if (!forecast.columns || forecast.columns.length < 1 || forecast.columns[0].length < 1) {
    return <InternalError inline />;
  }
  if (!forecast.data || !forecast.rows || forecast.data.length !== forecast.rows.length) {
    return <InternalError inline />;
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
        data: data,
      });
    }
  }

  return <ForecastPeriod periods={periods} />;
};

const ForecastPeriod: React.FunctionComponent<{periods: period[]}> = ({periods}) => {
  return (
    <VStack alignItems="stretch" pt={4}>
      {periods.map((period, index) => (
        <VStack space={2} key={index} py={12} borderBottomWidth={1} borderColor={index !== periods.length - 1 ? colorLookup('light.300') : 'white'}>
          <HStack flex={1} space={4} flexWrap={'wrap'}>
            <BodyBlack>{period.meta.heading}</BodyBlack>
            {period.meta.subheading && <Body>{period.meta.subheading}</Body>}
          </HStack>
          <View borderWidth={1} borderColor={colorLookup('light.300')} borderRadius={8} mt={12}>
            {period.data.map(
              (item, periodIndex) =>
                periodIndex % 2 === 0 && (
                  <HStack
                    key={`${index}-${periodIndex}`}
                    justifyContent="space-between"
                    alignItems="stretch"
                    borderBottomWidth={periodIndex < period.data.length - 2 ? 1 : 0}
                    borderColor={colorLookup('light.300')}>
                    <VStack flexBasis={0.5} flex={1} m={12}>
                      <ForecastValue forecastItem={item} />
                    </VStack>
                    <View width={1} height="100%" bg={colorLookup('light.300')} flex={0} />
                    <VStack flexBasis={0.5} flex={1} m={12}>
                      {periodIndex + 1 < period.data.length && <ForecastValue forecastItem={period.data[periodIndex + 1]} />}
                    </VStack>
                  </HStack>
                ),
            )}
          </View>
        </VStack>
      ))}
    </VStack>
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
