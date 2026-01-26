import React, {useCallback} from 'react';
import {Image, ScrollView, StyleSheet} from 'react-native';

import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CameraBounds, MarkerView} from '@rnmapbox/maps';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {Card, CardProps} from 'components/content/Card';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {ZoneMap} from 'components/content/ZoneMap';
import {MediaCarousel} from 'components/content/carousel/MediaCarousel';
import {HStack, VStack, View} from 'components/core';
import {NACAvalancheIcon} from 'components/icons/nac-icons';
import {matchesZone} from 'components/observations/ObservationsFilterForm';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySemibold, bodySize} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNACObservation} from 'hooks/useNACObservation';
import {useNWACObservation} from 'hooks/useNWACObservation';
import {usePostHog} from 'posthog-react-native';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {
  Activity,
  AllAvalancheCenterCapabilities,
  AvalancheAspect,
  AvalancheBedSurface,
  AvalancheCause,
  AvalancheCenterID,
  AvalancheTrigger,
  AvalancheType,
  AvyPosition,
  CloudCover,
  DangerLevel,
  FormatActivity,
  FormatAvalancheAspect,
  FormatAvalancheBedSurface,
  FormatAvalancheCause,
  FormatAvalancheTrigger,
  FormatAvalancheType,
  FormatCloudCover,
  FormatInstabilityDistribution,
  FormatSnowAvailableForTransport,
  FormatWindLoading,
  InstabilityDistribution,
  MapLayer,
  Observation,
  Position,
  SnowAvailableForTransport,
  WindLoading,
  userFacingCenterId,
} from 'types/nationalAvalancheCenter';
import {observationDateToLocalShortDateString, utcDateToLocalShortDateString} from 'utils/date';

export const NWACObservationDetailView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useNWACObservation(parseInt(id));
  const observation = observationResult.data;
  const mapResult = useMapLayer(observation?.center_id);
  const mapLayer = mapResult.data;
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;

  if (incompleteQueryState(observationResult, mapResult, capabilitiesResult) || !observation || !mapLayer || !capabilities) {
    return <QueryState results={[observationResult, mapResult, capabilitiesResult]} />;
  }

  return <ObservationCard observation={observation} mapLayer={mapLayer} capabilities={capabilities} />;
};

export const ObservationDetailView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useNACObservation(id);
  const observation = observationResult.data;
  const mapResult = useMapLayer(observation?.center_id?.toUpperCase() as AvalancheCenterID);
  const mapLayer = mapResult.data;
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;

  if (incompleteQueryState(observationResult, mapResult, capabilitiesResult) || !observation || !mapLayer || !capabilities || !capabilities) {
    return <QueryState results={[observationResult, mapResult, capabilitiesResult]} />;
  }

  return <ObservationCard observation={observation} mapLayer={mapLayer} capabilities={capabilities} />;
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
  // observation.advanced_fields.weather might be missing, or might be an object that's filled with empty strings -
  // in either of those cases, we don't have weather data to render.
  const hasWeatherEntries = Object.entries(observation.advanced_fields?.weather || {}).some(([_k, v]) => Boolean(v));

  if (!hasWeatherEntries && !observation.advanced_fields?.weather_summary) {
    return null;
  }

  return (
    <Card borderRadius={0} borderColor="white" header={<BodyBlack>Weather</BodyBlack>} {...props}>
      <VStack space={8} width="100%">
        {/* Using Boolean() here so that we don't end up rendering empty strings inline */}
        {observation.advanced_fields?.weather_summary && <HTML source={{html: observation.advanced_fields?.weather_summary}} />}
        {observation.advanced_fields?.weather?.cloud_cover && (
          <TableRow label={'Cloud Cover'} value={FormatCloudCover(observation.advanced_fields?.weather?.cloud_cover as CloudCover)} />
        )}
        {observation.advanced_fields?.weather?.air_temp && <TableRow label={'Temperature (F)'} value={observation.advanced_fields?.weather?.air_temp} />}
        {observation.advanced_fields?.weather?.recent_snowfall && <TableRow label={'New or Recent Snowfall'} value={observation.advanced_fields?.weather?.recent_snowfall} />}
        {observation.advanced_fields?.weather?.rain_elevation && <TableRow label={'Rain/Snow Line (ft)'} value={observation.advanced_fields?.weather?.rain_elevation} />}
        {observation.advanced_fields?.weather?.snow_avail_for_transport && (
          <TableRow
            label={'Snow Available For Transport'}
            value={FormatSnowAvailableForTransport(observation.advanced_fields?.weather?.snow_avail_for_transport as SnowAvailableForTransport)}
          />
        )}
        {observation.advanced_fields?.weather?.wind_loading && (
          <TableRow label={'Wind Loading'} value={FormatWindLoading(observation.advanced_fields?.weather?.wind_loading as WindLoading)} />
        )}
      </VStack>
    </Card>
  );
};

// NWAC observations do not require that a user choose a specific point on the map; instead, they allow
// simply choosing the forecast zone. NAC observations, on the other hand, expect the user to choose *only*
// a point on the map and do not allow the zone to be chosen. In our adaptive layer that exposes NWAC observations
// as if they were on the NAC system, a set of placeholder locations is used to add location points to those
// observations that otherwise do not have them, to allow the code downstream to know that the point exists.
// We can use that point to determine the zone that the observation was in, but do not want to show the point
// to users, as it will not match where the observation was actually submitted.
const placeholders: AvyPosition[] = [
  {longitude: -120.80902913139369, latitude: 47.4769558629764},
  {longitude: -120.6576884996371, latitude: 48.508873866573},
  {longitude: -121.4923824736508, latitude: 46.20049381811555},
  {longitude: -121.69703035377452, latitude: 45.36977193873633},
  {longitude: -123.70620207968125, latitude: 47.8010450209029},
  {longitude: -122.33426358631552, latitude: 47.6009139228834},
  {longitude: -121.398011481564, latitude: 47.43050191839139},
  {longitude: -121.09839553823569, latitude: 47.75708705098087},
  {longitude: -121.41689869612796, latitude: 48.20857063251787},
  {longitude: -121.60378434771066, latitude: 48.83086824211633},
  {longitude: -121.45393919813452, latitude: 46.93280523754054},
];
const isPlaceholder = (latitude: number, longitude: number): boolean => {
  return placeholders.map(position => position.latitude === latitude && position.longitude === longitude).reduce((current, accumulator) => current || accumulator, false);
};
export const withUnits = (value: string | number | null | undefined, units: string) => {
  if (value == null) {
    return 'Unknown';
  } else if (Number.isNaN(Number(value))) {
    return value;
  } else {
    return `${value}${units}`;
  }
};

export const ObservationCard: React.FunctionComponent<{
  observation: Observation;
  mapLayer: MapLayer;
  capabilities: AllAvalancheCenterCapabilities;
}> = ({observation, mapLayer, capabilities}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const {avalanches_observed, avalanches_triggered, avalanches_caught} = observation.instability;
  const zone_name = observation.location_point?.lat && observation.location_point?.lng && matchesZone(mapLayer, observation.location_point?.lat, observation.location_point?.lng);
  React.useEffect(() => {
    if (zone_name) {
      navigation.setOptions({title: `${zone_name} Observation`});
    }
  }, [navigation, zone_name]);
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && observation.center_id && observation.id) {
      postHog.screen('observation', {
        center: observation.center_id,
        id: observation.id,
      });
    }
  }, [postHog, observation.center_id, observation.id]);
  useFocusEffect(recordAnalytics);

  const nePosition: Position = [(observation.location_point.lng ?? 0) + 0.075 / 2, (observation.location_point.lat ?? 0) + 0.075 / 2];
  const swPosition: Position = [(observation.location_point.lng ?? 0) - 0.075 / 2, (observation.location_point.lat ?? 0) - 0.075 / 2];
  const initialCameraBounds: CameraBounds = {ne: nePosition, sw: swPosition};

  return (
    <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}}>
      <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
        <VStack space={8} backgroundColor="white" style={{height: '100%', width: '100%'}}>
          <ScrollView style={{height: '100%', width: '100%'}}>
            <VStack space={8} backgroundColor={colorLookup('primary.background')}>
              <View bg="white" py={8} px={16}>
                <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
                  <VStack space={8} style={{flex: 1}}>
                    <AllCapsSmBlack>Observed</AllCapsSmBlack>
                    <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                      {observationDateToLocalShortDateString(observation.start_date)}
                    </AllCapsSm>
                  </VStack>
                  <VStack space={8} style={{flex: 1}}>
                    <AllCapsSmBlack>Submitted</AllCapsSmBlack>
                    <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                      {utcDateToLocalShortDateString(observation.created_at)}
                    </AllCapsSm>
                  </VStack>
                  <VStack space={8} style={{flex: 1}}>
                    <AllCapsSmBlack>Author</AllCapsSmBlack>
                    <AllCapsSm style={{textTransform: 'none'}} color="text.secondary" unescapeHTMLEntities>
                      {observation.name || 'Unknown'}
                    </AllCapsSm>
                  </VStack>
                </HStack>
              </View>
              <Card borderRadius={0} borderColor="white" header={<BodyBlack>Summary</BodyBlack>}>
                <VStack space={8} width="100%">
                  {observation.location_point.lat && observation.location_point.lng && !isPlaceholder(observation.location_point.lat, observation.location_point.lng) && (
                    <ZoneMap
                      style={{width: '100%', height: 200}}
                      zones={[]}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      scrollEnabled={true}
                      zoomEnabled={true}
                      initialCameraBounds={initialCameraBounds}>
                      <MarkerView coordinate={[observation.location_point.lng, observation.location_point.lat]} anchor={{x: 0.5, y: 1}}>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                        <Image source={require('assets/map-marker.png')} style={{width: 40, height: 40}} />
                      </MarkerView>
                    </ZoneMap>
                  )}
                  <TableRow label="Avalanche Center" value={userFacingCenterId(observation.center_id, capabilities)} />
                  {observation.location_name && <TableRow label="Location" value={observation.location_name} />}
                  <TableRow label="Route" value={observation.route || 'Not specified'} />
                  <TableRow label="Activity" value={activityDisplayName(observation.activity)} />
                  {observation.observation_summary && <HTML source={{html: observation.observation_summary}} />}
                  <View pt={8}>
                    <BodySemibold>Signs of Instability</BodySemibold>
                  </View>
                  {/* Avalanche section */}
                  <HStack space={8}>
                    <NACAvalancheIcon size={bodySize} color={avalanches_observed ? colorFor(DangerLevel.High).string() : colorLookup('text')} />
                    <Body>{avalanches_observed ? 'Avalanche(s) Observed' : 'No Avalanche(s) Observed'}</Body>
                  </HStack>
                  {avalanches_triggered && (
                    <HStack space={8}>
                      <NACAvalancheIcon size={bodySize} color={colorFor(DangerLevel.High).string()} />
                      <Body>{'Avalanche(s) Triggered'}</Body>
                    </HStack>
                  )}
                  {avalanches_caught && (
                    <HStack space={8}>
                      <NACAvalancheIcon size={bodySize} color={colorFor(DangerLevel.High).string()} />
                      <Body>{'Caught In Avalanche'}</Body>
                    </HStack>
                  )}
                  {/* Collapsing section */}
                  <HStack space={8}>
                    <MaterialCommunityIcons
                      name="flag"
                      size={bodySize}
                      color={observation.instability.collapsing ? colorFor(DangerLevel.Considerable).string() : colorLookup('text')}
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
                      color={observation.instability.cracking ? colorFor(DangerLevel.Considerable).string() : colorLookup('text')}
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
              {(observation.media ?? []).length > 0 && (
                <Card borderRadius={0} borderColor="white" header={<BodyBlack>Media</BodyBlack>}>
                  <MediaCarousel thumbnailHeight={160} thumbnailAspectRatio={1.3} mediaItems={observation.media ?? []} />
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
                        <TableRow label={`Date (${item.date_known ? 'Exact' : 'Estimated'})`} value={`${observationDateToLocalShortDateString(item.date)}`} />
                        {item.d_size && <TableRow label={'Size'} value={`D${item.d_size}${item.r_size ? '-R' + item.r_size : ''}`} />}
                        {item.trigger && (
                          <TableRow
                            label={'Trigger'}
                            value={`${FormatAvalancheTrigger(item.trigger as AvalancheTrigger)}${item.cause ? ' - ' + FormatAvalancheCause(item.cause as AvalancheCause) : ''}`}
                          />
                        )}
                        <TableRow
                          label={'Start Zone'}
                          value={`${FormatAvalancheAspect(item.aspect as AvalancheAspect)}${item.slope_angle ? `, ${item.slope_angle}°` : ''} at ${withUnits(
                            item.elevation,
                            'ft',
                          )}`}
                        />
                        {item.vertical_fall && <TableRow label={'Vertical Fall'} value={`${withUnits(item.vertical_fall, 'ft')}`} />}
                        {item.avg_crown_depth && <TableRow label={'Crown Thickness'} value={`${withUnits(item.avg_crown_depth, 'cm')}`} />}
                        {item.width && <TableRow label={'Width'} value={`${withUnits(item.width, 'ft')}`} />}
                        {item.avalanche_type && <TableRow label={'Type'} value={FormatAvalancheType(item.avalanche_type as AvalancheType)} />}
                        {item.bed_sfc && <TableRow label={'Bed Surface'} value={FormatAvalancheBedSurface(item.bed_sfc as AvalancheBedSurface)} />}
                        {item.media && (
                          <VStack pt={8} space={8} width="100%">
                            <BodySemibold>Media</BodySemibold>
                            <MediaCarousel thumbnailHeight={160} thumbnailAspectRatio={1.3} mediaItems={item.media} />
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
                      {observation.advanced_fields.snowpack_media && (
                        <MediaCarousel thumbnailHeight={160} thumbnailAspectRatio={1.3} mediaItems={observation.advanced_fields.snowpack_media} />
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
