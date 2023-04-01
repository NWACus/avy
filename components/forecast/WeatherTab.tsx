import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ActionList} from 'components/content/ActionList';
import {Card, CollapsibleCard} from 'components/content/Card';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySm, BodyXSmBlack, bodyXSmSize, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import helpStrings from 'content/helpStrings';
import {add} from 'date-fns';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {FormatTimeOfDay, useNWACWeatherForecast} from 'hooks/useNWACWeatherForecast';
import {useRefresh} from 'hooks/useRefresh';
import {useWeatherStations} from 'hooks/useWeatherStations';
import React from 'react';
import {RefreshControl, ScrollView} from 'react-native';
import {HomeStackParamList, TabNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheForecastZone} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, pacificDateToDayOfWeekString, RequestedTime, utcDateToLocalTimeString} from 'utils/date';

type ForecastNavigationProp = CompositeNavigationProp<NativeStackNavigationProp<HomeStackParamList, 'forecast'>, TabNavigationProps>;

interface WeatherTabProps {
  zone: AvalancheForecastZone;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
}

const SmallHeaderWithTooltip = ({title, content, dialogTitle}) => (
  // the icon style is designed to make the circle "i" look natural next to the
  // text - neither `center` nor `baseline` alignment look good on their own
  <HStack space={6} alignItems="center" justifyContent="space-between" width="100%">
    <BodyXSmBlack style={{flex: 1}}>{title}</BodyXSmBlack>
    <InfoTooltip size={bodyXSmSize} title={dialogTitle || title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />
  </HStack>
);

export const WeatherTab: React.FC<WeatherTabProps> = ({zone, center_id, requestedTime}) => {
  const nwacForecastResult = useNWACWeatherForecast(zone.id, requestedTime);
  const nwacForecast = nwacForecastResult.data;
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const mapLayerResult = useMapLayer(center_id);
  const mapLayer = mapLayerResult.data;
  const stationsResult = useWeatherStations({
    token: metadata?.widget_config.stations.token,
    mapLayer: mapLayer,
    sources: center_id === 'NWAC' ? ['nwac'] : ['mesowest', 'snotel'],
  });
  const weatherStationsByZone = stationsResult.data;
  const {isRefreshing, refresh} = useRefresh(nwacForecastResult.refetch, stationsResult.refetch, avalancheCenterMetadataResult.refetch, mapLayerResult.refetch);

  const navigation = useNavigation<ForecastNavigationProp>();

  if (incompleteQueryState(nwacForecastResult, avalancheCenterMetadataResult, mapLayerResult, stationsResult)) {
    return <QueryState results={[nwacForecastResult, avalancheCenterMetadataResult, mapLayerResult, stationsResult]} />;
  }

  // In the UI, we show weather station groups, which may contain 1 or more weather stations.
  // Example: Alpental Ski Area shows 3 weather stations.
  const groupedWeatherStations = Object.entries(weatherStationsByZone?.find(zoneData => zoneData.zoneId === zone.id)?.stationGroups || {}).sort((a, b) => a[0].localeCompare(b[0]));

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
  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}>
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
                {utcDateToLocalTimeString(expires_time)}
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
                    navigation.navigate('stationDetail', {
                      center_id,
                      station_stids: stations.map(s => s.stid),
                      name,
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
