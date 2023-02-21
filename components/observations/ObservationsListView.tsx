import React from 'react';

import {FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {geoContains} from 'd3-geo';
import {compareDesc, parseISO, sub} from 'date-fns';
import {ActivityIndicator, FlatList, View} from 'react-native';
import {ObservationsStackNavigationProps} from 'routes';

import {Card} from 'components/content/Card';
import {HStack, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {Body, BodyBlack, Title3Semibold} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useMapLayer} from 'hooks/useMapLayer';
import {OverviewFragment, useObservationsQuery} from 'hooks/useObservations';
import {AvalancheCenterID, FormatAvalancheProblemDistribution, FormatPartnerType, MapLayer, PartnerType} from 'types/nationalAvalancheCenter';
import {apiDateString, utcDateToLocalTimeString} from 'utils/date';

// TODO: we could show the Avy center logo for obs that come from forecasters

export const ObservationsListView: React.FunctionComponent<{
  center_id: AvalancheCenterID;
  date: Date;
}> = ({center_id, date}) => {
  const {isLoading: isMapLoading, isError: isMapError, data: mapLayer, error: mapError} = useMapLayer(center_id);

  const startDate: string = apiDateString(sub(date, {months: 1}));
  const endDate: string = apiDateString(date);
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
        {isMapError && <Body>{`Could not fetch ${center_id} map layer: ${mapError}.`}</Body>}
        {isObservationsError && <Body>{`Could not fetch ${center_id} observations: ${observationsError}.`}</Body>}
      </View>
    );
  }
  if (!observations.getObservationList || observations.getObservationList.length === 0) {
    // TODO: when cleaning this up, fix it so that it renders the date in the user's locale, not UTC date
    return (
      <View>
        <Body>{`No observations were recorded for ${center_id} between ${startDate} and ${endDate}.`}</Body>
      </View>
    );
  }

  observations.getObservationList.sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));

  return (
    <FlatList
      data={observations.getObservationList.map(observation => ({
        id: observation.id,
        observation: observation,
        zone: zone(mapLayer, observation.locationPoint.lat, observation.locationPoint.lng),
      }))}
      renderItem={({item}) => <ObservationSummaryCard observation={item.observation} zone={item.zone} />}
    />
  );
};

export const zone = (mapLayer: MapLayer, lat: number, long: number): string => {
  const matchingFeatures = mapLayer.features.filter(feature => geoContains(feature.geometry, [long, lat])).map(feature => feature.properties.name);
  if (matchingFeatures.length === 0) {
    return 'Unknown';
  } else if (matchingFeatures.length > 1) {
    // TODO: this happens almost 100% ... why?
    // also, seems like the widget is naming things with more specificity than just the forecast zones? e.g. teton village
    console.log(`(${long},${lat}) matched ${matchingFeatures.length} features: ${matchingFeatures}`);
  }
  return matchingFeatures[0];
};

export const ObservationSummaryCard: React.FunctionComponent<{
  observation: OverviewFragment;
  zone: string;
}> = ({zone, observation}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const anySignsOfInstability =
    observation.instability.avalanches_caught ||
    observation.instability.avalanches_observed ||
    observation.instability.avalanches_triggered ||
    observation.instability.collapsing ||
    observation.instability.cracking;
  return (
    <Card
      marginTop={2}
      borderRadius={8}
      borderColor="white"
      onPress={() => {
        navigation.navigate('observation', {
          id: observation.id,
        });
      }}
      header={
        <HStack alignContent="flex-start" flexWrap="wrap" alignItems="center" space={8}>
          <Title3Semibold>{zone}</Title3Semibold>
          <FontAwesome name="angle-right" size={18} style={{paddingHorizontal: 4}} color="black" />
          <Title3Semibold>{observation.locationName}</Title3Semibold>
        </HStack>
      }>
      <HStack flexWrap="wrap" space={8}>
        <IdentifiedInformation header={'Submitted'} body={utcDateToLocalTimeString(observation.createdAt)} />
        <IdentifiedInformation header={'Observer'} body={FormatPartnerType(observation.observerType as PartnerType)} />
        <IdentifiedInformation header={'Author(s)'} body={observation.name || 'Unknown'} />
      </HStack>
      {anySignsOfInstability && (
        <VStack space={8} style={{flex: 1}}>
          <BodyBlack style={{textTransform: 'uppercase'}}>{'Signs Of Instability'}</BodyBlack>
          {observation.instability.avalanches_caught && (
            <HStack space={8} alignItems="center">
              <NACIcon name="avalanche" size={32} color="black" />
              <Body color="text.secondary">{'Caught in Avalanche(s)'}</Body>
            </HStack>
          )}
          {observation.instability.avalanches_observed && (
            <HStack space={8} alignItems="center">
              <NACIcon name="avalanche" size={32} color="black" />
              <Body color="text.secondary">{'Avalanche(s) Observed'}</Body>
            </HStack>
          )}
          {observation.instability.avalanches_triggered && (
            <HStack space={8} alignItems="center">
              <NACIcon name="avalanche" size={32} color="black" />
              <Body color="text.secondary">{'Avalanche(s) Triggered'}</Body>
            </HStack>
          )}
          {observation.instability.collapsing && (
            <HStack space={8} alignItems="center">
              <MaterialCommunityIcons name="arrow-collapse-vertical" size={24} color="black" />
              <Body color="text.secondary">
                {observation.instability.collapsing_description && `${FormatAvalancheProblemDistribution(observation.instability.collapsing_description)} `}
                {'Collapsing Observed'}
              </Body>
            </HStack>
          )}
          {observation.instability.cracking && (
            <HStack space={8} alignItems="center">
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="black" />
              <Body color="text.secondary">
                {observation.instability.cracking_description && `${FormatAvalancheProblemDistribution(observation.instability.cracking_description)} `}
                {'Cracking Observed'}
              </Body>
            </HStack>
          )}
        </VStack>
      )}
      {observation.observationSummary && (
        <VStack space={8} style={{flex: 1}}>
          <BodyBlack style={{textTransform: 'uppercase'}}>{'Observation Summary'}</BodyBlack>
          <HTML source={{html: observation.observationSummary}} />
        </VStack>
      )}
    </Card>
  );
};

const IdentifiedInformation: React.FunctionComponent<{
  header: string;
  body: string;
}> = ({header, body}) => {
  return (
    <VStack space={8} style={{flex: 1}}>
      <BodyBlack style={{textTransform: 'uppercase'}}>{header}</BodyBlack>
      <Body color="text.secondary">{body}</Body>
    </VStack>
  );
};
