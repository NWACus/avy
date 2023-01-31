import {Card, CollapsibleCard} from 'components/content/Card';
import {Center, HStack, View, VStack} from 'components/core';
import {useLatestWeatherForecast} from 'hooks/useLatestWeatherForecast';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySemibold, bodySize, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheForecastZone} from 'types/nationalAvalancheCenter';
import {apiDateString, utcDateToLocalTimeString} from 'utils/date';
import {InfoTooltip} from 'components/content/InfoTooltip';
import helpStrings from 'content/helpStrings';
import {useWeatherStations} from 'hooks/useWeatherStations';
import {ActionList} from 'components/content/ActionList';
import {CompositeNavigationProp, useNavigation} from '@react-navigation/native';
import {HomeStackParamList, TabNavigationProps} from 'routes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

type ForecastNavigationProp = CompositeNavigationProp<NativeStackNavigationProp<HomeStackParamList, 'forecast'>, TabNavigationProps>;

interface WeatherTabProps {
  zone: AvalancheForecastZone;
  center_id: AvalancheCenterID;
  date: Date;
}

const timeOfDayString = (period: 'day' | 'night', subperiod: 'early' | 'late') => {
  if (period === 'day') {
    return subperiod === 'early' ? 'morning' : 'afternoon';
  } else {
    return subperiod === 'early' ? 'evening' : 'overnight';
  }
};

const SmallHeaderWithTooltip = ({title, content, dialogTitle}) => (
  // the icon style is designed to make the circle "i" look natural next to the
  // text - neither `center` nor `baseline` alignment look good on their own
  <HStack space={6} alignItems="center">
    <BodySemibold>{title}</BodySemibold>
    <InfoTooltip size={bodySize} title={dialogTitle || title} content={content} style={{paddingBottom: 0, paddingTop: 1}} />
  </HStack>
);

export const WeatherTab: React.FC<WeatherTabProps> = ({zone, center_id, date}) => {
  const {isLoading, isError, data: forecast} = useLatestWeatherForecast(center_id, zone);
  const {status: weatherStationStatus, data: weatherStationsByZone} = useWeatherStations({center: center_id, sources: center_id === 'NWAC' ? ['nwac'] : ['mesowest', 'snotel']});

  const navigation = useNavigation<ForecastNavigationProp>();

  // In the UI, we show weather station groups, which may contain 1 or more weather stations.
  // Example: Alpental Ski Area shows 3 weather stations.
  const groupedWeatherStations = Object.entries(weatherStationsByZone?.find(zoneData => zoneData.zoneId === zone.id)?.stationGroups || {}).sort((a, b) => a[0].localeCompare(b[0]));

  if (isLoading) {
    return (
      <Center style={StyleSheet.absoluteFillObject}>
        <ActivityIndicator />
      </Center>
    );
  } else if (isError) {
    return (
      <Center style={StyleSheet.absoluteFillObject}>
        <Body>Could not fetch weather forecast for zone {zone.name}</Body>
      </Center>
    );
  }

  return (
    <VStack space={8} bgColor={'#f0f2f5'}>
      <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Weather Forecast</Title3Black>}>
        <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Issued</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {utcDateToLocalTimeString(forecast.published_time)}
            </AllCapsSm>
          </VStack>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Expires</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {utcDateToLocalTimeString(forecast.expires_time)}
            </AllCapsSm>
          </VStack>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Author</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {forecast.author || 'Unknown'}
              {'\n'}
            </AllCapsSm>
          </VStack>
        </HStack>
        <VStack alignItems="stretch" pt={4}>
          {forecast.data.slice(0, 2).map((forecast, index) => {
            return (
              <VStack space={2} key={index} py={12} borderBottomWidth={1} borderColor={index === 0 ? colorLookup('light.200') : 'white'}>
                <BodyBlack>{forecast.label}</BodyBlack>
                <Body>{forecast.forecast}</Body>
                <HStack justifyContent="space-between" alignItems="flex-start" pt={12} space={12}>
                  <VStack flexBasis={0.5} flex={1}>
                    <SmallHeaderWithTooltip title="5K ft Temps (°F)" dialogTitle="Temperature" content={helpStrings.weather.temperature} />
                    <Body>
                      {forecast.temperatures.high} (max) / {forecast.temperatures.low} (min)
                    </Body>
                  </VStack>
                  <VStack flexBasis={0.5} flex={1}>
                    <SmallHeaderWithTooltip title="Snow Level (ft)" dialogTitle="Snow Level" content={helpStrings.weather.snowLevelNoAsterisk} />
                    {forecast.snowLevel.map(level => (
                      <Body key={level.subperiod}>
                        {Intl.NumberFormat().format(level.level)} {timeOfDayString(level.period, level.subperiod)}
                      </Body>
                    ))}
                  </VStack>
                </HStack>
                <HStack justifyContent="space-between" alignItems="flex-start" pt={12} space={12}>
                  <VStack flexBasis={0.5} flex={1}>
                    <SmallHeaderWithTooltip title="Precipitation (in)" dialogTitle="Precipitation" content={helpStrings.weather.precipitation} />
                    {Object.entries(forecast.precipitation).map(([zone, value]) => (
                      <HStack key={zone} justifyContent="space-between" alignItems="flex-start" alignSelf="stretch">
                        <View flex={1} flexGrow={2} pr={12}>
                          <Body style={{flex: 1, flexBasis: 0.75}}>{zone}</Body>
                        </View>
                        <View flex={1} flexGrow={1}>
                          <Body>{value}</Body>
                        </View>
                      </HStack>
                    ))}
                  </VStack>
                  <VStack flexBasis={0.5} flex={1}>
                    <SmallHeaderWithTooltip title="Ridgeline Winds (mph)" dialogTitle="Ridgeline Winds" content={helpStrings.weather.wind} />
                    {forecast.winds.map(level => (
                      <Body key={level.subperiod}>
                        {level.speed} {timeOfDayString(level.period, level.subperiod)}
                      </Body>
                    ))}
                  </VStack>
                </HStack>
              </VStack>
            );
          })}
        </VStack>
      </Card>
      <CollapsibleCard marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Synopsis</Title3Black>} startsCollapsed={true}>
        <HTML source={{html: forecast.synopsis}} />
      </CollapsibleCard>
      <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Weather Station Data</Title3Black>}>
        <VStack>
          {(weatherStationStatus === 'loading' || weatherStationStatus === 'idle') && (
            <View py={6}>
              <ActivityIndicator size={16} />
            </View>
          )}
          {weatherStationStatus === 'error' && (
            <HStack py={6}>
              <Body>Error loading weather stations.</Body>
            </HStack>
          )}
          {weatherStationStatus === 'success' && groupedWeatherStations.length > 0 && (
            <ActionList
              actions={groupedWeatherStations.map(([name, stations]) => ({
                label: name,
                data: stations,
                action: () => {
                  // Nested navigation to the stationDetail page of the Weather Data stack
                  navigation.navigate('Weather Data', {
                    screen: 'stationDetail',
                    // Treat this as the first screen in the Weather Data stack - don't show a back button going to the stationList
                    initial: true,
                    params: {center_id, station_ids: stations.map(s => s.id), name, dateString: apiDateString(date)},
                  });
                },
              }))}
            />
          )}
          {weatherStationStatus === 'success' && groupedWeatherStations.length === 0 && (
            <HStack py={6}>
              <Body>No weather stations in this zone.</Body>
            </HStack>
          )}
        </VStack>
      </Card>
    </VStack>
  );
};
