import log from 'logger';

import React from 'react';
import {Image, ScrollView, StyleSheet} from 'react-native';

import {AntDesign, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {colorFor} from 'components/AvalancheDangerPyramid';
import {Card, CardProps} from 'components/content/Card';
import {Carousel} from 'components/content/carousel';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {ZoneMap} from 'components/content/ZoneMap';
import {Center, HStack, View, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {zone} from 'components/observations/ObservationsListView';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySemibold, bodySize, Title3Black} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNACObservation} from 'hooks/useNACObservation';
import {useNWACObservation} from 'hooks/useNWACObservation';
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
  DangerLevel,
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
  const observationResult = useNACObservation(id);
  const mapResult = useMapLayer(observationResult.data?.center_id?.toUpperCase() as AvalancheCenterID);
  const mapLayer = mapResult.data;

  if (incompleteQueryState(observationResult, mapResult)) {
    return <QueryState results={[observationResult, mapResult]} />;
  }

  return <ObservationCard observation={observationResult.data} mapLayer={mapLayer} />;
};

const dataTableFlex = [1, 1];
const dataTableSpace = 16;

export const TableRow = ({label, value}: {label: string; value: string}) => (
  <HStack justifyContent="space-between" alignItems="center" width="100%" space={dataTableSpace}>
    <View flex={dataTableFlex[0]}>
      <BodySemibold>{label}</BodySemibold>
    </View>
    <View flex={dataTableFlex[1]}>
      <Body>{value}</Body>
    </View>
  </HStack>
);

export const WeatherCard = ({observation, ...props}: {observation: Observation} & CardProps) => {
  const {weather = {}, weather_summary = ''} = observation.advanced_fields || {};
  // observation.advanced_fields.weather might be missing, or might be an object that's filled with empty strings -
  // in either of those cases, we don't have weather data to render.
  const hasWeatherEntries = Object.entries(weather || {}).some(([_k, v]) => Boolean(v));

  if (!hasWeatherEntries && !weather_summary) {
    return null;
  }

  const {cloud_cover, air_temp, recent_snowfall, rain_elevation, snow_avail_for_transport, wind_loading} = weather;

  return (
    <Card borderRadius={0} borderColor="white" header={<BodyBlack>Weather</BodyBlack>} {...props}>
      <VStack space={8} width="100%">
        {/* Using Boolean() here so that we don't end up rendering empty strings inline */}
        {Boolean(weather_summary) && <HTML source={{html: weather_summary}} />}
        {Boolean(cloud_cover) && <TableRow label={'Cloud Cover'} value={FormatCloudCover(cloud_cover as CloudCover)} />}
        {Boolean(air_temp) && <TableRow label={'Temperature (F)'} value={air_temp || 'Unknown'} />}
        {Boolean(recent_snowfall) && <TableRow label={'New or Recent Snowfall'} value={recent_snowfall} />}
        {Boolean(rain_elevation) && <TableRow label={'Rain/Snow Line (ft)'} value={rain_elevation || 'Unknown'} />}
        {Boolean(snow_avail_for_transport) && (
          <TableRow label={'Snow Available For Transport'} value={FormatSnowAvailableForTransport(snow_avail_for_transport as SnowAvailableForTransport)} />
        )}
        {Boolean(wind_loading) && <TableRow label={'Wind Loading'} value={FormatWindLoading(wind_loading as WindLoading)} />}
      </VStack>
    </Card>
  );
};

export const ObservationCard: React.FunctionComponent<{
  observation: Observation;
  mapLayer: MapLayer;
}> = ({observation, mapLayer}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const {avalanches_observed, avalanches_triggered, avalanches_caught} = observation.instability;

  log.info(observation);
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
              <Card borderRadius={0} borderColor="white" header={<BodyBlack>Summary</BodyBlack>}>
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
                  <View pt={8}>
                    <BodySemibold>Signs of Instability</BodySemibold>
                  </View>
                  {/* Avalanche section */}
                  <HStack space={8}>
                    <NACIcon name="avalanche" size={bodySize} color={avalanches_observed ? colorFor(DangerLevel.High).string() : colorLookup('darkText')} />
                    <Body>{avalanches_observed ? 'Avalanche(s) Observed' : 'No Avalanche(s) Observed'}</Body>
                  </HStack>
                  {avalanches_triggered && (
                    <HStack space={8}>
                      <NACIcon name="avalanche" size={bodySize} color={colorFor(DangerLevel.High).string()} />
                      <Body>{'Avalanche(s) Triggered'}</Body>
                    </HStack>
                  )}
                  {avalanches_caught && (
                    <HStack space={8}>
                      <NACIcon name="avalanche" size={bodySize} color={colorFor(DangerLevel.High).string()} />
                      <Body>{'Caught In Avalanche'}</Body>
                    </HStack>
                  )}
                  {/* Collapsing section */}
                  <HStack space={8}>
                    <MaterialCommunityIcons
                      name="flag"
                      size={bodySize}
                      color={observation.instability.collapsing ? colorFor(DangerLevel.Considerable).string() : colorLookup('darkText')}
                    />
                    <Body>
                      {observation.instability.collapsing
                        ? `${FormatInstabilityDistribution(observation.instability.collapsing_description as InstabilityDistribution)} Collapsing`
                        : 'No Collapsing Observed'}
                    </Body>
                  </HStack>
                  {/* Cracking section */}
                  <HStack space={8}>
                    <MaterialCommunityIcons
                      name="flag"
                      size={bodySize}
                      color={observation.instability.cracking ? colorFor(DangerLevel.Considerable).string() : colorLookup('darkText')}
                    />
                    <Body>
                      {observation.instability.cracking
                        ? `${FormatInstabilityDistribution(observation.instability.cracking_description as InstabilityDistribution)} Cracking`
                        : 'No Cracking Observed'}
                    </Body>
                  </HStack>

                  {observation.instability_summary && (
                    <VStack pt={8} space={8} width="100%">
                      <BodySemibold>Instability Comments</BodySemibold>
                      <HTML source={{html: observation.instability_summary}} />
                    </VStack>
                  )}
                </VStack>
              </Card>
              {observation.media && observation.media.length > 0 && (
                <Card borderRadius={0} borderColor="white" header={<BodyBlack>Media</BodyBlack>}>
                  <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={observation.media} displayCaptions={false} />
                </Card>
              )}
              {((observation.avalanches && observation.avalanches.length > 0) || observation.avalanches_summary) && (
                <Card borderRadius={0} borderColor="white" header={<BodyBlack>Avalanches</BodyBlack>}>
                  <VStack space={8} width="100%">
                    {observation.avalanches_summary && <HTML source={{html: observation.avalanches_summary}} />}
                  </VStack>
                  {observation.avalanches &&
                    observation.avalanches.length > 0 &&
                    observation.avalanches.map((item, index) => (
                      <VStack space={8} style={{flex: 1}} key={`avalanche-${index}`}>
                        <BodyBlack>{`#${index + 1}${item.location ? `: ${item.location}` : ''}`}</BodyBlack>
                        {item.comments && <HTML source={{html: item.comments}} />}
                        <TableRow
                          label={`Date${item.dateAccuracy ? ` (${FormatAvalancheDateUncertainty(item.dateAccuracy as AvalancheDateUncertainty)})` : ''}`}
                          value={`${utcDateToLocalTimeString(item.date)}`}
                        />
                        {item.dSize && item.rSize && <TableRow label={'Size'} value={`D${item.dSize}-R${item.rSize}`} />}
                        {item.trigger && item.cause && (
                          <TableRow
                            label={'Trigger'}
                            value={`${FormatAvalancheTrigger(item.trigger as AvalancheTrigger)} - ${FormatAvalancheCause(item.cause as AvalancheCause)}`}
                          />
                        )}
                        <TableRow
                          label={'Start Zone'}
                          value={`${FormatAvalancheAspect(item.aspect as AvalancheAspect)}${item.slopeAngle ? `, ${item.slopeAngle}°` : ''} at ${item.elevation}ft`}
                        />
                        {item.verticalFall && <TableRow label={'Vertical Fall'} value={`${item.verticalFall}ft`} />}
                        {item.avgCrownDepth && <TableRow label={'Crown Thickness'} value={`${item.avgCrownDepth}cm`} />}
                        {item.width && <TableRow label={'Width'} value={`${item.width}ft`} />}
                        {item.avalancheType && <TableRow label={'Type'} value={FormatAvalancheType(item.avalancheType as AvalancheType)} />}
                        {item.verticalFall && <TableRow label={'Bed Surface'} value={FormatAvalancheBedSurface(item.bedSfc as AvalancheBedSurface)} />}
                        {item.media && item.media.length > 0 && (
                          <VStack pt={8} space={8} width="100%">
                            <BodySemibold>Media</BodySemibold>
                            <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={item.media} displayCaptions={false} />
                          </VStack>
                        )}
                      </VStack>
                    ))}
                </Card>
              )}
              <WeatherCard observation={observation} />
              {observation.advanced_fields &&
                (observation.advanced_fields.snowpack ||
                  (observation.advanced_fields.snowpack_media && observation.advanced_fields.snowpack_media.length > 0) ||
                  observation.advanced_fields.snowpack_summary) && (
                  <Card borderRadius={0} borderColor="white" header={<BodyBlack>Snowpack</BodyBlack>}>
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
