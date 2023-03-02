import log from 'logger';
import React from 'react';
import {Image, ScrollView, StyleSheet} from 'react-native';

import {AntDesign, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Sentry from 'sentry-expo';

import {Card} from 'components/content/Card';
import {Carousel} from 'components/content/carousel';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {ZoneMap} from 'components/content/ZoneMap';
import {Center, HStack, View, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {zone} from 'components/observations/ObservationsListView';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySemibold, bodySize, Title1Black, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNWACObservation} from 'hooks/useNWACObservation';
import {useObservationQuery} from 'hooks/useObservations';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
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
    log.info('unparsable observation', id, parseResult.error, JSON.stringify(observation.getSingleObservation));
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

const dataTableFlex = [1, 1];
const dataTableSpace = 16;

const TableRow = ({label, value}: {label: string; value: string}) => (
  <HStack justifyContent="space-between" alignItems="center" width="100%" space={dataTableSpace}>
    <View flex={dataTableFlex[0]}>
      <BodySemibold>{label}</BodySemibold>
    </View>
    <View flex={dataTableFlex[1]}>
      <Body>{value}</Body>
    </View>
  </HStack>
);

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

export const ObservationCard: React.FunctionComponent<{
  observation: Observation;
  mapLayer: MapLayer;
}> = ({observation, mapLayer}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();

  return (
    <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
        <VStack space={8} backgroundColor="white" style={{height: '100%', width: '100%'}}>
          <HStack justifyContent="flex-start" pb={8}>
            <AntDesign.Button
              size={24}
              color={colorLookup('text')}
              name="arrowleft"
              backgroundColor="white"
              iconStyle={{marginLeft: 0, marginRight: 8}}
              style={{textAlign: 'center'}}
              onPress={() => navigation.goBack()}
            />
            <Title3Black>{`${zone(mapLayer, observation.location_point?.lat, observation.location_point?.lng)} Observation`}</Title3Black>
          </HStack>
          <ScrollView style={{height: '100%', width: '100%'}}>
            <VStack space={8} backgroundColor={colorLookup('background.base')}>
              <View bg="white" py={8} px={16}>
                <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
                  <VStack space={8} style={{flex: 1}}>
                    <AllCapsSmBlack>Submitted</AllCapsSmBlack>
                    <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                      {utcDateToLocalTimeString(observation.created_at)}
                    </AllCapsSm>
                  </VStack>
                  <VStack space={8} style={{flex: 1}}>
                    <AllCapsSmBlack>Author</AllCapsSmBlack>
                    <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                      {observation.name || 'Unknown'}
                    </AllCapsSm>
                  </VStack>
                </HStack>
              </View>
              <Card borderRadius={0} borderColor="white" header={<Title3Black>Summary</Title3Black>}>
                <VStack space={8} width="100%">
                  {observation.location_point?.lat && observation.location_point?.lng && (
                    <ZoneMap
                      style={{width: '100%', height: 200}}
                      animated={false}
                      zones={[]}
                      onPressPolygon={() => undefined}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      initialRegion={{
                        latitude: observation.location_point.lat,
                        longitude: observation.location_point.lng,
                        latitudeDelta: 0.075,
                        longitudeDelta: 0.075,
                      }}>
                      <Center width="100%" height="100%" position="absolute" backgroundColor={undefined} pointerEvents="none">
                        <Image source={require('assets/map-marker.png')} style={{width: 40, height: 40, transform: [{translateY: -20}]}} />
                      </Center>
                    </ZoneMap>
                  )}
                  <TableRow label="Location" value={observation.location_name} />
                  <TableRow label="Route" value={observation.route || 'Not specified'} />
                  <TableRow label="Activity" value={activityDisplayName(observation.activity)} />
                  {observation.observation_summary && <HTML source={{html: observation.observation_summary}} />}
                </VStack>
              </Card>
              <Card borderRadius={0} borderColor="white" header={<Title3Black>Signs of Unstable Snow</Title3Black>}>
                <VStack space={8} width="100%">
                  {/* Avalanche section */}
                  <HStack space={8}>
                    <NACIcon name="avalanche" size={bodySize} color={colorLookup('darkText')} />
                    <BodySemibold style={{width: '100%'}}>Avalanches</BodySemibold>
                  </HStack>
                  <TableRow label="Avalanches Observed?" value={yesNo(observation.instability.avalanches_observed)} />
                  <TableRow label="Avalanches Triggered?" value={yesNo(observation.instability.avalanches_triggered)} />
                  <TableRow label="Caught In Avalanches?" value={yesNo(observation.instability.avalanches_caught)} />
                  {/* Collapsing section */}
                  <HStack space={8} mt={8}>
                    <MaterialCommunityIcons name="arrow-collapse-vertical" size={bodySize} color="black" />
                    <BodySemibold>Collapsing</BodySemibold>
                  </HStack>
                  <TableRow
                    label="Collapsing observed?"
                    value={
                      observation.instability.collapsing
                        ? FormatInstabilityDistribution(observation.instability.collapsing_description as InstabilityDistribution)
                        : 'None Observed'
                    }
                  />
                  {/* Cracking section */}
                  <HStack space={8} mt={8}>
                    <MaterialCommunityIcons name="lightning-bolt" size={bodySize} color="black" />
                    <BodySemibold>Cracking</BodySemibold>
                  </HStack>
                  <TableRow
                    label="Cracking observed?"
                    value={
                      observation.instability.cracking ? FormatInstabilityDistribution(observation.instability.cracking_description as InstabilityDistribution) : 'None Observed'
                    }
                  />
                  {observation.instability_summary && <HTML source={{html: observation.instability_summary}} />}
                </VStack>
              </Card>
              {observation.media && observation.media.length > 0 && (
                <Card borderRadius={0} borderColor="white" header={<Title3Black>Media</Title3Black>}>
                  <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={observation.media} displayCaptions={false} />
                </Card>
              )}
              {((observation.avalanches && observation.avalanches.length > 0) || observation.avalanches_summary) && (
                <Card
                  borderRadius={0}
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
                          <IdentifiedInformation
                            header={'Start Zone'}
                            body={`${FormatAvalancheAspect(item.aspect as AvalancheAspect)}, ${item.slopeAngle}° at ${item.elevation}ft`}
                          />
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
                </Card>
              )}
              {observation.advanced_fields && (observation.advanced_fields.weather || observation.advanced_fields.weather_summary) && (
                <Card borderRadius={0} borderColor="white" header={<Title3Black>Weather</Title3Black>}>
                  <VStack space={8} width="100%">
                    {observation.advanced_fields.weather_summary && <HTML source={{html: observation.advanced_fields.weather_summary}} />}
                    {observation.advanced_fields.weather && (
                      <VStack space={8} width="100%">
                        <TableRow label={'Cloud Cover'} value={FormatCloudCover(observation.advanced_fields.weather.cloud_cover as CloudCover)} />
                        <TableRow label={'Temperature (F)'} value={observation.advanced_fields.weather.air_temp || 'Unknown'} />
                        <TableRow label={'New or Recent Snowfall'} value={observation.advanced_fields.weather.recent_snowfall} />
                        <TableRow label={'Rain/Snow Line (ft)'} value={observation.advanced_fields.weather.rain_elevation || 'Unknown'} />
                        <TableRow
                          label={'Snow Available For Transport'}
                          value={FormatSnowAvailableForTransport(observation.advanced_fields.weather.snow_avail_for_transport as SnowAvailableForTransport)}
                        />
                        <TableRow label={'Wind Loading'} value={FormatWindLoading(observation.advanced_fields.weather.wind_loading as WindLoading)} />
                      </VStack>
                    )}
                  </VStack>
                </Card>
              )}
              {observation.advanced_fields &&
                (observation.advanced_fields.snowpack ||
                  (observation.advanced_fields.snowpack_media && observation.advanced_fields.snowpack_media.length > 0) ||
                  observation.advanced_fields.snowpack_summary) && (
                  <Card borderRadius={0} borderColor="white" header={<Title3Black>Snowpack</Title3Black>}>
                    <VStack space={8} width="100%">
                      {observation.advanced_fields.snowpack_summary && <HTML source={{html: observation.advanced_fields.snowpack_summary}} />}
                      {observation.advanced_fields.snowpack_media && observation.advanced_fields.snowpack_media.length > 0 && (
                        <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={observation.advanced_fields.snowpack_media} displayCaptions={false} />
                      )}
                      {observation.advanced_fields.snowpack && <>{/* we don't know what fields could be in this thing ... */}</>}
                    </VStack>
                  </Card>
                )}
            </VStack>
          </ScrollView>
        </VStack>
      </SafeAreaView>
    </View>
  );
};

const activityDisplayName = (activity: string[] | undefined): string => {
  if (!activity || activity.length < 1) {
    return FormatActivity(Activity.Other);
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
