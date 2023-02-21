import {FontAwesome5, Fontisto, MaterialCommunityIcons} from '@expo/vector-icons';
import {AvalancheProblemImage} from 'components/AvalancheProblemImage';
import {Card, CollapsibleCard} from 'components/content/Card';
import {HStack, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {zone} from 'components/observations/ObservationsListView';
import {Body, BodyBlack, FeatureTitleBlack, Title1Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useMapLayer} from 'hooks/useMapLayer';
import {EverythingFragment, useObservationQuery} from 'hooks/useObservations';
import React from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, View} from 'react-native';
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
} from 'types/nationalAvalancheCenter';
import {utcDateToLocalTimeString} from 'utils/date';

export const ObservationDetailView: React.FunctionComponent<{
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
        {isMapError && <Body>{`Could not fetch ${observation.getSingleObservation.centerId} map layer: ${mapError}.`}</Body>}
        {isObservationError && <Body>{`Could not fetch ${observation.getSingleObservation.centerId} observation ${id}: ${observationError}.`}</Body>}
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
      <VStack space={8} bgColor={'#f0f2f5'}>
        <Card
          marginTop={2}
          borderRadius={0}
          borderColor="white"
          header={<FeatureTitleBlack>{`${FormatPartnerType(observation.observerType as PartnerType)} Field Observation`}</FeatureTitleBlack>}>
          <VStack space={8}>
            <HStack flexWrap="wrap" space={8} alignItems="flex-start">
              <IdentifiedInformation header={'Submitted'} body={utcDateToLocalTimeString(observation.createdAt)} />
              {observation.endDate && <IdentifiedInformation header={'Expires'} body={utcDateToLocalTimeString(observation.endDate)} />}
              <IdentifiedInformation header={'Author(s)'} body={observation.name || 'Unknown'} />
              <IdentifiedInformation header={'Activity'} body={activityDisplayName(observation.activity)} />
            </HStack>
            <HStack flexWrap="wrap" space={8} alignItems="flex-start">
              <IdentifiedInformation header={'Zone/Region'} body={zone(mapLayer, observation.locationPoint.lat, observation.locationPoint.lng)} />
              <IdentifiedInformation header={'Location'} body={observation.locationName} />
              <IdentifiedInformation header={'Route'} body={observation.route} />
            </HStack>
          </VStack>
        </Card>
        <CollapsibleCard
          startsCollapsed={false}
          borderRadius={0}
          borderColor="white"
          header={
            <HStack space={8} alignItems="center">
              <FontAwesome5 name="info-circle" size={24} color="black" />
              <Title1Black>Observation Summary</Title1Black>
            </HStack>
          }>
          <HTML source={{html: observation.observationSummary}} />
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
          {observation.instabilitySummary && (
            <VStack space={8} style={{flex: 1}}>
              <BodyBlack style={{textTransform: 'uppercase'}}>{'Instability Comments'}</BodyBlack>
              <HTML source={{html: observation.instabilitySummary}} />
            </VStack>
          )}
        </CollapsibleCard>
        {observation.media && observation.media.length > 0 && (
          <CollapsibleCard
            startsCollapsed={false}
            borderRadius={0}
            borderColor="white"
            header={
              <HStack space={8} alignItems="center">
                <FontAwesome5 name="photo-video" size={24} color="black" />
                <Title1Black>Observation Media</Title1Black>
              </HStack>
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
              <HStack space={8} alignItems="center">
                <NACIcon name="avalanche" size={48} color="black" />
                <Title1Black>Avalanches</Title1Black>
              </HStack>
            }>
            {observation.avalanches &&
              observation.avalanches.length > 0 &&
              observation.avalanches.map((item, index) => (
                <VStack space={8} style={{flex: 1}} key={`avalanche-${index}`}>
                  <HStack space={8} alignItems="center">
                    <IdentifiedInformation
                      header={'Date'}
                      body={`${utcDateToLocalTimeString(item.date)} (${FormatAvalancheDateUncertainty(item.dateAccuracy as AvalancheDateUncertainty)})`}
                    />
                    <IdentifiedInformation header={'Location'} body={item.location} />
                    <IdentifiedInformation header={'Size'} body={`D${item.dSize}-R${item.rSize}`} />
                  </HStack>
                  <HStack space={8} alignItems="center">
                    <IdentifiedInformation
                      header={'Trigger'}
                      body={`${FormatAvalancheTrigger(item.trigger as AvalancheTrigger)} - ${FormatAvalancheCause(item.cause as AvalancheCause)}`}
                    />
                    <IdentifiedInformation header={'Start Zone'} body={`${FormatAvalancheAspect(item.aspect as AvalancheAspect)}, ${item.slopeAngle}° at ${item.elevation}ft`} />
                    <IdentifiedInformation header={'Vertical Fall'} body={`${item.verticalFall}ft`} />
                  </HStack>
                  <HStack space={8} alignItems="center">
                    <IdentifiedInformation header={'Crown Thickness'} body={`${item.avgCrownDepth}cm`} />
                    <IdentifiedInformation header={'Width'} body={`${item.width}ft`} />
                    <IdentifiedInformation header={'Type'} body={FormatAvalancheType(item.avalancheType as AvalancheType)} />
                    <IdentifiedInformation header={'Bed Surface'} body={FormatAvalancheBedSurface(item.bedSfc as AvalancheBedSurface)} />
                  </HStack>
                  <>
                    {item.media && item.media.length > 0 && (
                      <VStack space={8} style={{flex: 1}}>
                        <BodyBlack style={{textTransform: 'uppercase'}}>{'Avalanche Media'}</BodyBlack>
                        {item.media
                          .filter(mediaItem => mediaItem.type === 'image')
                          .map((mediaItem, mediaIndex) => (
                            <AvalancheProblemImage key={`avalanche-${index}-media-item-${mediaIndex}`} media={mediaItem} />
                          ))}
                      </VStack>
                    )}
                  </>
                  <>
                    {item.comments && (
                      <VStack space={8} style={{flex: 1}}>
                        <BodyBlack style={{textTransform: 'uppercase'}}>{'Avalanche Comments'}</BodyBlack>
                        <HTML source={{html: item.comments}} />
                      </VStack>
                    )}
                  </>
                </VStack>
              ))}
            {observation.avalanchesSummary && (
              <VStack space={8} style={{flex: 1}}>
                <BodyBlack style={{textTransform: 'uppercase'}}>{'Avalanche Summary'}</BodyBlack>
                <HTML source={{html: observation.avalanchesSummary}} />
              </VStack>
            )}
          </CollapsibleCard>
        )}
        {observation.advancedFields && (observation.advancedFields.weather || observation.advancedFields.weatherSummary) && (
          <CollapsibleCard
            startsCollapsed={false}
            borderRadius={0}
            borderColor="white"
            header={
              <HStack space={8} alignItems="center">
                <MaterialCommunityIcons name="weather-snowy-heavy" size={24} color="black" />
                <Title1Black>Weather</Title1Black>
              </HStack>
            }>
            <>
              {observation.advancedFields.weather && (
                <>
                  <HStack flexWrap="wrap" space={8}>
                    <IdentifiedWeatherInformation header={'Cloud Cover'} body={FormatCloudCover(observation.advancedFields.weather.cloud_cover)} />
                    <IdentifiedWeatherInformation header={'Temperature (F)'} body={observation.advancedFields.weather.air_temp} />
                    <IdentifiedWeatherInformation header={'New or Recent Snowfall'} body={observation.advancedFields.weather.recent_snowfall} />
                  </HStack>
                  <HStack flexWrap="wrap" space={8}>
                    <IdentifiedWeatherInformation header={'Rain/Snow Line (ft)'} body={observation.advancedFields.weather.rain_elevation} />
                    <IdentifiedWeatherInformation
                      header={'Snow Available For Transport'}
                      body={FormatSnowAvailableForTransport(observation.advancedFields.weather.snow_avail_for_transport)}
                    />
                    <IdentifiedWeatherInformation header={'Wind Loading'} body={FormatWindLoading(observation.advancedFields.weather.wind_loading)} />
                  </HStack>
                </>
              )}
            </>
            <>
              {observation.advancedFields.weatherSummary && (
                <VStack space={8} style={{flex: 1}}>
                  <BodyBlack style={{textTransform: 'uppercase'}}>{'Weather Summary'}</BodyBlack>
                  <HTML source={{html: observation.advancedFields.weatherSummary}} />
                </VStack>
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
                <HStack space={8} alignItems="center">
                  <Fontisto name="snowflake" size={24} color="black" />
                  <Title1Black>Snowpack Observations</Title1Black>
                </HStack>
              }>
              <>{observation.advancedFields.snowpack && <>{/* we don't know what fields could be in this thing ... */}</>}</>
              <>
                {observation.advancedFields.snowpackSummary && (
                  <VStack space={8} style={{flex: 1}}>
                    <BodyBlack style={{textTransform: 'uppercase'}}>{'Snowpack Summary'}</BodyBlack>
                    <HTML source={{html: observation.advancedFields.snowpackSummary}} />
                  </VStack>
                )}
              </>
              <>
                {observation.advancedFields.snowpackMedia && observation.advancedFields.snowpackMedia.length > 0 && (
                  <>
                    <VStack space={8} style={{flex: 1}}>
                      <BodyBlack style={{textTransform: 'uppercase'}}>{'Snowpack Media'}</BodyBlack>
                      {observation.advancedFields.snowpackMedia
                        .filter(item => item.type === 'image')
                        .map((item, index) => (
                          <AvalancheProblemImage key={`media-item-${index}`} media={item} />
                        ))}
                    </VStack>
                  </>
                )}
              </>
            </CollapsibleCard>
          )}
      </VStack>
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
    <VStack space={8} style={{flex: 1}}>
      <BodyBlack style={{textTransform: 'uppercase'}}>{header}</BodyBlack>
      <Body color="text.secondary">{body}</Body>
    </VStack>
  );
};

const IdentifiedWeatherInformation: React.FunctionComponent<{
  header: string;
  body: string;
}> = ({header, body}) => {
  return (
    <VStack space={8} style={{flex: 1}}>
      <BodyBlack style={{textTransform: 'uppercase'}}>{header}</BodyBlack>
      <Body color="text.secondary" style={{textTransform: 'capitalize', fontStyle: body === '' ? 'italic' : 'normal'}}>
        {body || 'Not Observed'}
      </Body>
    </VStack>
  );
};
