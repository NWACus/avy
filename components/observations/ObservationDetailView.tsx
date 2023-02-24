import {FontAwesome5, Fontisto, MaterialCommunityIcons} from '@expo/vector-icons';
import {Card, CollapsibleCard} from 'components/content/Card';
import {Carousel} from 'components/content/carousel';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {zone} from 'components/observations/ObservationsListView';
import {Body, BodyBlack, FeatureTitleBlack, Title1Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNWACObservation} from 'hooks/useNWACObservation';
import {useObservationQuery} from 'hooks/useObservations';
import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import * as Sentry from 'sentry-expo';
import {
  Activity,
  AvalancheAspect,
  AvalancheBedSurface,
  AvalancheCause,
  AvalancheCenterID,
  AvalancheDateUncertainty,
  AvalancheTrigger,
  AvalancheType,
  CloudCover,
  FormatActivity,
  FormatAvalancheAspect,
  FormatAvalancheBedSurface,
  FormatAvalancheCause,
  FormatAvalancheDateUncertainty,
  FormatAvalancheTrigger,
  FormatAvalancheType,
  FormatCloudCover,
  FormatInstabilityDistribution,
  FormatPartnerType,
  FormatSnowAvailableForTransport,
  FormatWindLoading,
  InstabilityDistribution,
  MapLayer,
  Observation,
  observationSchema,
  SnowAvailableForTransport,
  WindLoading,
} from 'types/nationalAvalancheCenter';
import {utcDateToLocalTimeString} from 'utils/date';

export const NWACObservationDetailView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useNWACObservation(parseInt(id));
  const observation = observationResult.data;
  const mapResult = useMapLayer(observation?.center_id);
  const mapLayer = mapResult.data;

  if (incompleteQueryState(observationResult, mapResult)) {
    return <QueryState results={[observationResult, mapResult]} />;
  }

  return <ObservationCard observation={observation} mapLayer={mapLayer} />;
};

export const ObservationDetailView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useObservationQuery({
    id: id,
  });
  const observation = observationResult.data;
  const mapResult = useMapLayer(observation?.getSingleObservation.center_id?.toUpperCase() as AvalancheCenterID);
  const mapLayer = mapResult.data;

  if (incompleteQueryState(observationResult, mapResult)) {
    return <QueryState results={[observationResult, mapResult]} />;
  }

  const parseResult = observationSchema.deepPartial().safeParse(observation.getSingleObservation);
  if (parseResult.success === false) {
    console.log('unparsable observation', id, parseResult.error, JSON.stringify(observation.getSingleObservation, null, 2));
    Sentry.Native.captureException(parseResult.error, {
      tags: {
        zod_error: true,
        id,
      },
    });
    throw parseResult.error;
  } else {
    return <ObservationCard observation={parseResult.data} mapLayer={mapLayer} />;
  }
};

export const ObservationCard: React.FunctionComponent<{
  observation: Observation;
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
          header={<FeatureTitleBlack>{`${FormatPartnerType(observation.observer_type)} Field Observation`}</FeatureTitleBlack>}>
          <VStack space={8}>
            <HStack flexWrap="wrap" space={8} alignItems="flex-start">
              <IdentifiedInformation header={'Submitted'} body={utcDateToLocalTimeString(observation.created_at)} />
              {observation.end_date && <IdentifiedInformation header={'Expires'} body={utcDateToLocalTimeString(observation.end_date)} />}
              <IdentifiedInformation header={'Author(s)'} body={observation.name || 'Unknown'} />
              {observation.activity && <IdentifiedInformation header={'Activity'} body={activityDisplayName(observation.activity)} />}
            </HStack>
            <HStack flexWrap="wrap" space={8} alignItems="flex-start">
              <IdentifiedInformation header={'Zone/Region'} body={zone(mapLayer, observation.location_point?.lat, observation.location_point?.lng)} />
              <IdentifiedInformation header={'Location'} body={observation.location_name} />
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
          <HTML source={{html: observation.observation_summary}} />
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
                    {observation.instability.collapsing_description &&
                      `${FormatInstabilityDistribution(observation.instability.collapsing_description as InstabilityDistribution)} `}
                    {'Collapsing Observed'}
                  </Body>
                </HStack>
              )}
              {observation.instability.cracking && (
                <HStack space={8} alignItems="center">
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color="black" />
                  <Body color="text.secondary">
                    {observation.instability.cracking_description && `${FormatInstabilityDistribution(observation.instability.cracking_description as InstabilityDistribution)} `}
                    {'Cracking Observed'}
                  </Body>
                </HStack>
              )}
            </VStack>
          )}
          {observation.instability_summary && (
            <VStack space={8} style={{flex: 1}}>
              <BodyBlack style={{textTransform: 'uppercase'}}>{'Instability Comments'}</BodyBlack>
              <HTML source={{html: observation.instability_summary}} />
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
            <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={observation.media} displayCaptions={false} />
          </CollapsibleCard>
        )}
        {((observation.avalanches && observation.avalanches.length > 0) || observation.avalanches_summary) && (
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
                        <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={item.media} displayCaptions={false} />
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
            {observation.avalanches_summary && (
              <VStack space={8} style={{flex: 1}}>
                <BodyBlack style={{textTransform: 'uppercase'}}>{'Avalanche Summary'}</BodyBlack>
                <HTML source={{html: observation.avalanches_summary}} />
              </VStack>
            )}
          </CollapsibleCard>
        )}
        {observation.advanced_fields && (observation.advanced_fields.weather || observation.advanced_fields.weather_summary) && (
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
              {observation.advanced_fields.weather && (
                <>
                  <HStack flexWrap="wrap" space={8}>
                    <IdentifiedWeatherInformation header={'Cloud Cover'} body={FormatCloudCover(observation.advanced_fields.weather.cloud_cover as CloudCover)} />
                    <IdentifiedWeatherInformation header={'Temperature (F)'} body={observation.advanced_fields.weather.air_temp} />
                    <IdentifiedWeatherInformation header={'New or Recent Snowfall'} body={observation.advanced_fields.weather.recent_snowfall} />
                  </HStack>
                  <HStack flexWrap="wrap" space={8}>
                    <IdentifiedWeatherInformation header={'Rain/Snow Line (ft)'} body={observation.advanced_fields.weather.rain_elevation} />
                    <IdentifiedWeatherInformation
                      header={'Snow Available For Transport'}
                      body={FormatSnowAvailableForTransport(observation.advanced_fields.weather.snow_avail_for_transport as SnowAvailableForTransport)}
                    />
                    <IdentifiedWeatherInformation header={'Wind Loading'} body={FormatWindLoading(observation.advanced_fields.weather.wind_loading as WindLoading)} />
                  </HStack>
                </>
              )}
            </>
            <>
              {observation.advanced_fields.weather_summary && (
                <VStack space={8} style={{flex: 1}}>
                  <BodyBlack style={{textTransform: 'uppercase'}}>{'Weather Summary'}</BodyBlack>
                  <HTML source={{html: observation.advanced_fields.weather_summary}} />
                </VStack>
              )}
            </>
          </CollapsibleCard>
        )}
        {observation.advanced_fields &&
          (observation.advanced_fields.snowpack ||
            (observation.advanced_fields.snowpack_media && observation.advanced_fields.snowpack_media.length > 0) ||
            observation.advanced_fields.snowpack_summary) && (
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
              <>{observation.advanced_fields.snowpack && <>{/* we don't know what fields could be in this thing ... */}</>}</>
              <>
                {observation.advanced_fields.snowpack_summary && (
                  <VStack space={8} style={{flex: 1}}>
                    <BodyBlack style={{textTransform: 'uppercase'}}>{'Snowpack Summary'}</BodyBlack>
                    <HTML source={{html: observation.advanced_fields.snowpack_summary}} />
                  </VStack>
                )}
              </>
              <>
                {observation.advanced_fields.snowpack_media && observation.advanced_fields.snowpack_media.length > 0 && (
                  <>
                    <VStack space={8} style={{flex: 1}}>
                      <BodyBlack style={{textTransform: 'uppercase'}}>{'Snowpack Media'}</BodyBlack>
                      <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={observation.advanced_fields.snowpack_media} displayCaptions={false} />
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
  if (!activity || activity.length < 1) {
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
