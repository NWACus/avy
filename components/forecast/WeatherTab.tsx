import {Card} from 'components/content/Card';
import {Center, HStack, View, VStack} from 'components/core';
import {useNWACWeatherForecast} from 'components/forecast/useNWACWeatherForecast';
import {AllCapsSm, AllCapsSmBlack, Body, FeatureTitleBlack, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator} from 'react-native';
import {AvalancheForecastZone} from 'types/nationalAvalancheCenter';
import {utcDateToLocalTimeString} from 'utils/date';

interface WeatherTabProps {
  zone: AvalancheForecastZone;
}

export const WeatherTab: React.FC<WeatherTabProps> = ({zone}) => {
  const {isLoading, isError, data: forecast} = useNWACWeatherForecast();

  if (isLoading) {
    return (
      <Center bg="white" width="100%" height="100%">
        <ActivityIndicator />
      </Center>
    );
  } else if (isError) {
    return (
      <Center bg="white" width="100%" height="100%">
        <Body>Could not fetch weather forecast for zone {zone.name}</Body>
      </Center>
    );
  }

  return (
    <VStack space={8} bgColor={'#f0f2f5'}>
      <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Weather Forecast</Title3Black>}>
        <HStack justifyContent="space-evenly" space={8}>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Issued</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {forecast.published_time}
            </AllCapsSm>
          </VStack>
          <VStack space={8} style={{flex: 1}}>
            <AllCapsSmBlack>Expires</AllCapsSmBlack>
            <AllCapsSm style={{textTransform: 'none'}} color="lightText">
              {forecast.expires_time}
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
      </Card>
      <HTML source={{html: forecast.synopsis}}></HTML>
    </VStack>
  );
};
