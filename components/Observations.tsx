import React from 'react';

import {compareDesc, format, parseISO, sub} from 'date-fns';
import {ActivityIndicator, View, FlatList} from 'react-native';
import {ObservationsStackNavigationProps} from 'routes';
import {useNavigation} from '@react-navigation/native';
import {Text, Row, Column} from 'native-base';
import {geoContains} from 'd3-geo';
import {FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';

import {Card} from 'components/Card';
import {OverviewFragment, useObservationsQuery} from 'hooks/useObservations';
import {useMapLayer} from 'hooks/useMapLayer';
import {AvalancheCenterID, FormatAvalancheProblemDistribution, FormatPartnerType, MapLayer, PartnerType} from '../types/nationalAvalancheCenter';
import {Title3Semibold} from './text';
import {HTML} from './text/HTML';
import {NACIcon} from './icons/nac-icons';
import {utcDateToLocalTimeString} from 'utils/date';

// TODO: we could show the Avy center logo for obs that come from forecasters

export const Observations: React.FunctionComponent<{
  center_id: AvalancheCenterID;
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
        <Row alignContent="flex-start" flexWrap="wrap" alignItems="center" space="2">
          <Title3Semibold>{zone}</Title3Semibold>
          <FontAwesome name="angle-right" size={18} style={{paddingHorizontal: 4}} color="black" />
          <Title3Semibold>{observation.locationName}</Title3Semibold>
        </Row>
      }>
      <Row flexWrap="wrap" space="2">
        <IdentifiedInformation header={'Submitted'} body={utcDateToLocalTimeString(observation.createdAt)} />
        <IdentifiedInformation header={'Observer'} body={FormatPartnerType(observation.observerType as PartnerType)} />
        <IdentifiedInformation header={'Author(s)'} body={observation.name || 'Unknown'} />
      </Row>
      {anySignsOfInstability && (
        <Column space="2" style={{flex: 1}}>
          <Text bold style={{textTransform: 'uppercase'}}>
            {'Signs Of Instability'}
          </Text>
          {observation.instability.avalanches_caught && (
            <Row space={2} alignItems="center">
              <NACIcon name="avalanche" size={32} color="black" />
              <Text color="lightText">{'Caught in Avalanche(s)'}</Text>
            </Row>
          )}
          {observation.instability.avalanches_observed && (
            <Row space={2} alignItems="center">
              <NACIcon name="avalanche" size={32} color="black" />
              <Text color="lightText">{'Avalanche(s) Observed'}</Text>
            </Row>
          )}
          {observation.instability.avalanches_triggered && (
            <Row space={2} alignItems="center">
              <NACIcon name="avalanche" size={32} color="black" />
              <Text color="lightText">{'Avalanche(s) Triggered'}</Text>
            </Row>
          )}
          {observation.instability.collapsing && (
            <Row space={2} alignItems="center">
              <MaterialCommunityIcons name="arrow-collapse-vertical" size={24} color="black" />
              <Text color="lightText">
                {observation.instability.collapsing_description && `${FormatAvalancheProblemDistribution(observation.instability.collapsing_description)} `}
                {'Collapsing Observed'}
              </Text>
            </Row>
          )}
          {observation.instability.cracking && (
            <Row space={2} alignItems="center">
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="black" />
              <Text color="lightText">
                {observation.instability.cracking_description && `${FormatAvalancheProblemDistribution(observation.instability.cracking_description)} `}
                {'Cracking Observed'}
              </Text>
            </Row>
          )}
        </Column>
      )}
      {observation.observationSummary && (
        <Column space="2" style={{flex: 1}}>
          <Text bold style={{textTransform: 'uppercase'}}>
            {'Observation Summary'}
          </Text>
          <HTML source={{html: observation.observationSummary}} />
        </Column>
      )}
    </Card>
  );
};

const IdentifiedInformation: React.FunctionComponent<{
  header: string;
  body: string;
}> = ({header, body}) => {
  return (
    <Column space="2" style={{flex: 1}}>
      <Text bold style={{textTransform: 'uppercase'}}>
        {header}
      </Text>
      <Text color="lightText">{body}</Text>
    </Column>
  );
};
