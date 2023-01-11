import React from 'react';
import {EverythingFragment, useObservationQuery} from 'hooks/useObservations';
import {ActivityIndicator, View, ScrollView, StyleSheet} from 'react-native';
import {Heading, Row, Text, Column} from 'native-base';
import {Card, CollapsibleCard} from 'components/Card';
import {FontAwesome5, MaterialCommunityIcons, Fontisto} from '@expo/vector-icons';
import {useMapLayer} from '../hooks/useMapLayer';
import {
  Activity,
  AvalancheAspect,
  AvalancheBedSurface,
  AvalancheCause,
  AvalancheCenterID,
  AvalancheDateUncertainty,
  AvalancheTrigger,
  AvalancheType,
  FormatActivity,
  FormatAvalancheAspect,
  FormatAvalancheBedSurface,
  FormatAvalancheCause,
  FormatAvalancheDateUncertainty,
  FormatAvalancheProblemDistribution,
  FormatAvalancheTrigger,
  FormatAvalancheType,
  FormatCloudCover,
  FormatPartnerType,
  FormatSnowAvailableForTransport,
  FormatWindLoading,
  MapLayer,
  PartnerType,
} from '../types/nationalAvalancheCenter';
import {zone} from './Observations';
import {HTML} from './text/HTML';
import {AvalancheProblemImage} from './AvalancheProblemImage';
import {NACIcon} from './icons/nac-icons';
import {utcDateToLocalTimeString} from 'utils/date';

export const Observation: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const {
    isLoading: isObservationLoading,
    isError: isObservationError,
    data: observation,
    error: observationError,
  } = useObservationQuery({
    id: id,
  });
  const {
    isLoading: isMapLoading,
    isError: isMapError,
    data: mapLayer,
    error: mapError,
  } = useMapLayer(observation?.getSingleObservation.centerId?.toUpperCase() as AvalancheCenterID);

  if (isObservationLoading || isMapLoading || !observation) {
    return <ActivityIndicator />;
  }
  if (isObservationError || isMapError) {
    return (
      <View>
        {isMapError && <Text>{`Could not fetch ${observation.getSingleObservation.centerId} map layer: ${mapError}.`}</Text>}
        {isObservationError && <Text>{`Could not fetch ${observation.getSingleObservation.centerId} observation ${id}: ${observationError}.`}</Text>}
      </View>
    );
  }

  return <ObservationCard observation={observation.getSingleObservation} mapLayer={mapLayer} />;
};

export const ObservationCard: React.FunctionComponent<{
  observation: EverythingFragment;
  mapLayer: MapLayer;
}> = ({observation, mapLayer}) => {
  const anySignsOfInstability =
    observation.instability.avalanches_caught ||
    observation.instability.avalanches_observed ||
    observation.instability.avalanches_triggered ||
    observation.instability.collapsing ||
    observation.instability.cracking;

  return (
    <ScrollView style={StyleSheet.absoluteFillObject}>
      <Column space="2" bgColor={'#f0f2f5'}>
        <Card marginTop={2} borderRadius={0} borderColor="white" header={<Heading>{`${FormatPartnerType(observation.observerType as PartnerType)} Field Observation`}</Heading>}>
          <Row flexWrap="wrap" space="2">
            <IdentifiedInformation header={'Submitted'} body={utcDateToLocalTimeString(observation.createdAt)} />
            {observation.endDate && <IdentifiedInformation header={'Expires'} body={utcDateToLocalTimeString(observation.endDate)} />}
            <IdentifiedInformation header={'Author(s)'} body={observation.name || 'Unknown'} />
            <IdentifiedInformation header={'Activity'} body={activityDisplayName(observation.activity)} />
          </Row>
          <Row flexWrap="wrap" space="2">
            <IdentifiedInformation header={'Zone/Region'} body={zone(mapLayer, observation.locationPoint.lat, observation.locationPoint.lng)} />
            <IdentifiedInformation header={'Location'} body={observation.locationName} />
            <IdentifiedInformation header={'Route'} body={observation.route} />
          </Row>
        </Card>
        <CollapsibleCard
          startsCollapsed={false}
          borderRadius={0}
          borderColor="white"
          header={
            <Row space={2} alignItems="center">
              <FontAwesome5 name="info-circle" size={24} color="black" />
              <Heading>Observation Summary</Heading>
            </Row>
          }>
          <HTML source={{html: observation.observationSummary}} />
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
          {observation.instabilitySummary && (
            <Column space="2" style={{flex: 1}}>
              <Text bold style={{textTransform: 'uppercase'}}>
                {'Instability Comments'}
              </Text>
              <HTML source={{html: observation.instabilitySummary}} />
            </Column>
          )}
        </CollapsibleCard>
        {observation.media && observation.media.length > 0 && (
          <CollapsibleCard
            startsCollapsed={false}
            borderRadius={0}
            borderColor="white"
            header={
              <Row space={2} alignItems="center">
                <FontAwesome5 name="photo-video" size={24} color="black" />
                <Heading>Observation Media</Heading>
              </Row>
            }>
            {observation.media
              .filter(item => item.type === 'image')
              .map((item, index) => (
                <AvalancheProblemImage key={`media-item-${index}`} media={item} />
              ))}
          </CollapsibleCard>
        )}
        {((observation.avalanches && observation.avalanches.length > 0) || observation.avalanchesSummary) && (
          <CollapsibleCard
            startsCollapsed={false}
            borderRadius={0}
            borderWidth={0}
            borderColor="white"
            header={
              <Row space={2} alignItems="center">
                <NACIcon name="avalanche" size={48} color="black" />
                <Heading>Avalanches</Heading>
              </Row>
            }>
            {observation.avalanches &&
              observation.avalanches.length > 0 &&
              observation.avalanches.map((item, index) => (
                <Column space="2" style={{flex: 1}} key={`avalanche-${index}`}>
                  <Row space={2} alignItems="center">
                    <IdentifiedInformation
                      header={'Date'}
                      body={`${utcDateToLocalTimeString(item.date)} (${FormatAvalancheDateUncertainty(item.dateAccuracy as AvalancheDateUncertainty)})`}
                    />
                    <IdentifiedInformation header={'Location'} body={item.location} />
                    <IdentifiedInformation header={'Size'} body={`D${item.dSize}-R${item.rSize}`} />
                  </Row>
                  <Row space={2} alignItems="center">
                    <IdentifiedInformation
                      header={'Trigger'}
                      body={`${FormatAvalancheTrigger(item.trigger as AvalancheTrigger)} - ${FormatAvalancheCause(item.cause as AvalancheCause)}`}
                    />
                    <IdentifiedInformation header={'Start Zone'} body={`${FormatAvalancheAspect(item.aspect as AvalancheAspect)}, ${item.slopeAngle}° at ${item.elevation}ft`} />
                    <IdentifiedInformation header={'Vertical Fall'} body={`${item.verticalFall}ft`} />
                  </Row>
                  <Row space={2} alignItems="center">
                    <IdentifiedInformation header={'Crown Thickness'} body={`${item.avgCrownDepth}cm`} />
                    <IdentifiedInformation header={'Width'} body={`${item.width}ft`} />
                    <IdentifiedInformation header={'Type'} body={FormatAvalancheType(item.avalancheType as AvalancheType)} />
                    <IdentifiedInformation header={'Bed Surface'} body={FormatAvalancheBedSurface(item.bedSfc as AvalancheBedSurface)} />
                  </Row>
                  <>
                    {item.media && item.media.length > 0 && (
                      <Column space="2" style={{flex: 1}}>
                        <Text bold style={{textTransform: 'uppercase'}}>
                          {'Avalanche Media'}
                        </Text>
                        {item.media
                          .filter(mediaItem => mediaItem.type === 'image')
                          .map((mediaItem, mediaIndex) => (
                            <AvalancheProblemImage key={`avalanche-${index}-media-item-${mediaIndex}`} media={mediaItem} />
                          ))}
                      </Column>
                    )}
                  </>
                  <>
                    {item.comments && (
                      <Column space="2" style={{flex: 1}}>
                        <Text bold style={{textTransform: 'uppercase'}}>
                          {'Avalanche Comments'}
                        </Text>
                        <HTML source={{html: item.comments}} />
                      </Column>
                    )}
                  </>
                </Column>
              ))}
            {observation.avalanchesSummary && (
              <Column space="2" style={{flex: 1}}>
                <Text bold style={{textTransform: 'uppercase'}}>
                  {'Avalanche Summary'}
                </Text>
                <HTML source={{html: observation.avalanchesSummary}} />
              </Column>
            )}
          </CollapsibleCard>
        )}
        {observation.advancedFields && (observation.advancedFields.weather || observation.advancedFields.weatherSummary) && (
          <CollapsibleCard
            startsCollapsed={false}
            borderRadius={0}
            borderColor="white"
            header={
              <Row space={2} alignItems="center">
                <MaterialCommunityIcons name="weather-snowy-heavy" size={24} color="black" />
                <Heading>Weather</Heading>
              </Row>
            }>
            <>
              {observation.advancedFields.weather && (
                <>
                  <Row flexWrap="wrap" space="2">
                    <IdentifiedWeatherInformation header={'Cloud Cover'} body={FormatCloudCover(observation.advancedFields.weather.cloud_cover)} />
                    <IdentifiedWeatherInformation header={'Temperature (F)'} body={observation.advancedFields.weather.air_temp} />
                    <IdentifiedWeatherInformation header={'New or Recent Snowfall'} body={observation.advancedFields.weather.recent_snowfall} />
                  </Row>
                  <Row flexWrap="wrap" space="2">
                    <IdentifiedWeatherInformation header={'Rain/Snow Line (ft)'} body={observation.advancedFields.weather.rain_elevation} />
                    <IdentifiedWeatherInformation
                      header={'Snow Available For Transport'}
                      body={FormatSnowAvailableForTransport(observation.advancedFields.weather.snow_avail_for_transport)}
                    />
                    <IdentifiedWeatherInformation header={'Wind Loading'} body={FormatWindLoading(observation.advancedFields.weather.wind_loading)} />
                  </Row>
                </>
              )}
            </>
            <>
              {observation.advancedFields.weatherSummary && (
                <Column space="2" style={{flex: 1}}>
                  <Text bold style={{textTransform: 'uppercase'}}>
                    {'Weather Summary'}
                  </Text>
                  <HTML source={{html: observation.advancedFields.weatherSummary}} />
                </Column>
              )}
            </>
          </CollapsibleCard>
        )}
        {observation.advancedFields &&
          (observation.advancedFields.snowpack ||
            (observation.advancedFields.snowpackMedia && observation.advancedFields.snowpackMedia.length > 0) ||
            observation.advancedFields.snowpackSummary) && (
            <CollapsibleCard
              startsCollapsed={false}
              borderRadius={0}
              borderColor="white"
              header={
                <Row space={2} alignItems="center">
                  <Fontisto name="snowflake" size={24} color="black" />
                  <Heading>Snowpack Observations</Heading>
                </Row>
              }>
              <>{observation.advancedFields.snowpack && <>{/* we don't know what fields could be in this thing ... */}</>}</>
              <>
                {observation.advancedFields.snowpackSummary && (
                  <Column space="2" style={{flex: 1}}>
                    <Text bold style={{textTransform: 'uppercase'}}>
                      {'Snowpack Summary'}
                    </Text>
                    <HTML source={{html: observation.advancedFields.snowpackSummary}} />
                  </Column>
                )}
              </>
              <>
                {observation.advancedFields.snowpackMedia && observation.advancedFields.snowpackMedia.length > 0 && (
                  <>
                    <Column space="2" style={{flex: 1}}>
                      <Text bold style={{textTransform: 'uppercase'}}>
                        {'Snowpack Media'}
                      </Text>
                      {observation.advancedFields.snowpackMedia
                        .filter(item => item.type === 'image')
                        .map((item, index) => (
                          <AvalancheProblemImage key={`media-item-${index}`} media={item} />
                        ))}
                    </Column>
                  </>
                )}
              </>
            </CollapsibleCard>
          )}
      </Column>
    </ScrollView>
  );
};

const activityDisplayName = (activity: string[]): string => {
  if (activity.length < 1) {
    FormatActivity(Activity.Other);
  }
  return FormatActivity(activity[0] as Activity);
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

const IdentifiedWeatherInformation: React.FunctionComponent<{
  header: string;
  body: string;
}> = ({header, body}) => {
  return (
    <Column space="2" style={{flex: 1}}>
      <Text bold style={{textTransform: 'uppercase'}}>
        {header}
      </Text>
      <Text color="lightText" style={{textTransform: 'capitalize', fontStyle: body === '' ? 'italic' : 'normal'}}>
        {body || 'Not Observed'}
      </Text>
    </Column>
  );
};
