import {Card, CollapsibleCard} from 'components/content/Card';
import {Center, HStack, View, VStack} from 'components/core';
import {useLatestWeatherForecast} from 'hooks/useLatestWeatherForecast';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySemibold, bodySize, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheForecastZone} from 'types/nationalAvalancheCenter';
import {utcDateToLocalTimeString} from 'utils/date';
import {InfoTooltip} from 'components/content/InfoTooltip';
import helpStrings from 'content/helpStrings';

interface WeatherTabProps {
  zone: AvalancheForecastZone;
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

export const WeatherTab: React.FC<WeatherTabProps> = ({zone}) => {
  const {isLoading, isError, isIdle, data: forecast} = useLatestWeatherForecast('NWAC', zone);

  if (isLoading || (isIdle && !forecast)) {
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
      <CollapsibleCard marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Synopsis</Title3Black>} startsCollapsed={false}>
        <HTML source={{html: forecast.synopsis}} />
      </CollapsibleCard>
    </VStack>
  );
};
