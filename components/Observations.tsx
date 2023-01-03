import React from 'react';

import {compareDesc, format, parseISO, sub} from 'date-fns';
import {ActivityIndicator, View, Text, FlatList, TouchableOpacity, useWindowDimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Box, Divider, VStack, HStack, Text as NBText, Heading} from 'native-base';
import {geoContains} from 'd3-geo';
import RenderHTML from 'react-native-render-html';

import {Card} from 'components/Card';
import {OverviewFragment, useObservationsQuery} from 'hooks/useObservations';
import {HomeStackNavigationProps} from 'routes';
import {useMapLayer} from 'hooks/useMapLayer';

// TODO: we could show the Avy center logo for obs that come from forecasters

export const Observations: React.FunctionComponent<{
  center_id: string;
  date: string;
}> = ({center_id, date}) => {
  const {isLoading: isMapLoading, isError: isMapError, data: mapLayer, error: mapError} = useMapLayer(center_id);

  const currentDate: Date = parseISO(date);
  const startDate: string = format(sub(currentDate, {months: 1}), 'y-MM-dd');
  const endDate: string = format(currentDate, 'y-MM-dd');
  const {
    isLoading: isObservationsLoading,
    isError: isObservationsError,
    data: observations,
    error: observationsError,
  } = useObservationsQuery({
    center: center_id,
    startDate: startDate,
    endDate: endDate,
  });

  if (isMapLoading || isObservationsLoading || !observations) {
    return <ActivityIndicator />;
  }
  if (isMapError || isObservationsError) {
    return (
      <View>
        {isMapError && <Text>{`Could not fetch ${center_id} map layer: ${mapError}.`}</Text>}
        {isObservationsError && <Text>{`Could not fetch ${center_id} observations: ${observationsError}.`}</Text>}
      </View>
    );
  }
  if (!observations.getObservationList || observations.getObservationList.length === 0) {
    return (
      <View>
        <Text>{`No observations were recorded for ${center_id} between ${startDate} and ${endDate}.`}</Text>
      </View>
    );
  }

  observations.getObservationList.sort((a, b) => compareDesc(parseISO(a.startDate), parseISO(b.startDate)));

  const zone = (lat: number, long: number): string => {
    const matchingFeatures = mapLayer.features.filter(feature => geoContains(feature.geometry, [long, lat])).map(feature => feature.properties.name);
    if (matchingFeatures.length === 0) {
      return '<no zone>';
    } else if (matchingFeatures.length > 1) {
      // TODO: this happens almost 100% ... why?
      // also, seems like the widget is naming things with more specificity than just the forecast zones? e.g. teton village
      console.log(`(${long},${lat}) matched ${matchingFeatures.length} features: ${matchingFeatures}`);
    }
    return matchingFeatures[0];
  };

  return (
    <FlatList
      data={observations.getObservationList.map(observation => ({
        id: observation.id,
        observation: observation,
        zone: zone(observation.locationPoint.lat, observation.locationPoint.lng),
      }))}
      renderItem={({item}) => <ObservationSummaryCard observation={item.observation} zone={item.zone} />}
    />
  );
};

export const ObservationSummaryCard: React.FunctionComponent<{
  observation: OverviewFragment;
  zone: string;
}> = ({zone, observation}) => {
  const navigation = useNavigation<HomeStackNavigationProps>();
  const {width} = useWindowDimensions();
  return (
    <Card
      onPress={() => {
        navigation.navigate('observation', {
          id: observation.id,
        });
      }}
      header={
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="md" flex={1} mr="8" fontWeight="normal">
            {zone + ' - ' + observation.locationName}
          </Heading>
          <Heading size="md" color="light.400" fontWeight="normal">
            {observation.startDate}
          </Heading>
        </HStack>
      }>
      <RenderHTML source={{html: observation.observationSummary}} contentWidth={width} />
      <HStack justifyContent="space-between" pt="4">
        <NBText color="light.400">{observation.name}</NBText>
        <NBText color="light.400">{observation.observerType}</NBText>
      </HStack>
    </Card>
  );
};
