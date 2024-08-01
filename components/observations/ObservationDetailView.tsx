import {AntDesign, Entypo} from '@expo/vector-icons';
import React, {useCallback} from 'react';
import {Button , Image, ScrollView, Share, StyleSheet, Text} from 'react-native';

import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {colorFor} from 'components/AvalancheDangerTriangle';
import {Card, CardProps} from 'components/content/Card';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {ZoneMap} from 'components/content/ZoneMap';
import {Carousel, images} from 'components/content/carousel';
import {HStack, VStack, View} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {matchesZone} from 'components/observations/ObservationsFilterForm';
import {AllCapsSm, AllCapsSmBlack, Body, BodyBlack, BodySemibold, bodySize} from 'components/text';
import {HTML} from 'components/text/HTML';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNACObservation} from 'hooks/useNACObservation';
import {useNWACObservation} from 'hooks/useNWACObservation';
import {usePostHog} from 'posthog-react-native';
import {LatLng, Marker} from 'react-native-maps';
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
import {pacificDateToLocalShortDateString, utcDateToLocalShortDateString, utcDateToLocalTimeString} from 'utils/date';

export const NWACObservationDetailView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useNWACObservation(parseInt(id));
  const observation = observationResult.data;
  const mapResult = useMapLayer(observation?.center_id);
  const mapLayer = mapResult.data;

  if (incompleteQueryState(observationResult, mapResult) || !observation || !mapLayer) {
    return <QueryState results={[observationResult, mapResult]} />;
  }

  return <ObservationCard observation={observation} mapLayer={mapLayer} />;
};

export const ObservationDetailView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useNACObservation(id);
  const observation = observationResult.data;
  const mapResult = useMapLayer(observation?.center_id?.toUpperCase() as AvalancheCenterID);
  const mapLayer = mapResult.data;

  if (incompleteQueryState(observationResult, mapResult) || !observation || !mapLayer) {
    return <QueryState results={[observationResult, mapResult]} />;
  }

  return <ObservationCard observation={observation} mapLayer={mapLayer} />;
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
const placeholders: LatLng[] = [
  {latitude: 47.4769558629764, longitude: -120.80902913139369},
  {
    latitude: 48.508873866573,
    longitude: -120.6576884996371,
  },
  {
    latitude: 46.20049381811555,
    longitude: -121.4923824736508,
  },
  {
    latitude: 45.36977193873633,
    longitude: -121.69703035377452,
  },
  {
    latitude: 47.8010450209029,
    longitude: -123.70620207968125,
  },
  {
    latitude: 47.6009139228834,
    longitude: -122.33426358631552,
  },
  {
    latitude: 47.43050191839139,
    longitude: -121.398011481564,
  },
  {
    latitude: 47.75708705098087,
    longitude: -121.09839553823569,
  },
  {
    latitude: 48.20857063251787,
    longitude: -121.41689869612796,
  },
  {
    latitude: 48.83086824211633,
    longitude: -121.60378434771066,
  },
  {
    latitude: 46.93280523754054,
    longitude: -121.45393919813452,
  },
];
const isPlaceholder = (latitude: number, longtiude: number): boolean => {
  return placeholders.map(point => point.latitude === latitude && point.longitude === longtiude).reduce((current, accumulator) => current || accumulator, false);
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
}> = ({observation, mapLayer}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const {avalanches_observed, avalanches_triggered, avalanches_caught} = observation.instability;
  const zone_name = observation.location_point?.lat && observation.location_point?.lng && matchesZone(mapLayer, observation.location_point?.lat, observation.location_point?.lng);
  React.useEffect(() => {
    if (zone_name) {
      navigation.setOptions({title: `${zone_name} Observation`});
    }
  }, [navigation, zone_name]);
  const emptyHandler = useCallback(() => undefined, []);
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    postHog?.screen('observation', {
      center: observation.center_id,
      id: observation.id,
    });
  }, [postHog, observation.center_id, observation.id]);
  useFocusEffect(recordAnalytics);

// route.path will have the link we would put into the share button here
const route = useRoute(); 

// currently the back button will leave to the list of obs of your current default center
// even if someone shares an observation with you from a different center
// the header will still show the current center logo (that likely needs to change as design actually said to replace that with the share icon)
// to open in expo: *check url and port, and correct obs ID that exists
// example: npx uri-scheme open exp://192.168.1.8:8082/--/observation/866b81db-52b3-4f94-890c-0cae8f162097 --android
const url = 'https://' + observation.center_id + '.us/observations/#/view/' + route.name + 's/' + route.params.id
  const onShare = async () => {
    try {
      const result = await Share.share({
        message:
          (url )
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}}>
      <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
        <VStack space={8} backgroundColor="white" style={{height: '100%', width: '100%'}}>
          <ScrollView style={{height: '100%', width: '100%'}}>
            <VStack space={8} backgroundColor={colorLookup('primary.background')}>
              <Card borderRadius={0} borderColor="white" header={
                <VStack space={8} width="100%">
                  <BodySemibold>
                    {zone_name} Observation
                      <Entypo 
                      size={22}
                      color={colorLookup('text')}
                      name="share-alternative"
                      backgroundColor="white"
                      iconStyle={{marginLeft: 20, marginRight: 0, marginTop: 1}}
                      style={{alignSelf: 'flex-end'}}
                      onPress={onShare}
                    />
                  </BodySemibold>
                  <BodySemibold>
                  {observation.center_id}
                  </BodySemibold>
                </VStack>
              }>
                <View bg="white" py={8} px={16}>
                  <HStack justifyContent="space-evenly" alignItems="flex-start" space={8}>
                    <VStack space={8} style={{flex: 1}}>
                      <AllCapsSmBlack>Observed</AllCapsSmBlack>
                      <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                        {pacificDateToLocalShortDateString(observation.start_date)}
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
              </Card>
              <Card borderRadius={0} borderColor="white" header={<BodyBlack>Summary</BodyBlack>}>
                <VStack space={8} width="100%">
                  {observation.location_point.lat && observation.location_point.lng && !isPlaceholder(observation.location_point.lat, observation.location_point.lng) && (
                    <ZoneMap
                      style={{width: '100%', height: 200}}
                      animated={false}
                      zones={[]}
                      onPressPolygon={emptyHandler}
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
                      <Marker
                        coordinate={{
                          latitude: observation.location_point.lat,
                          longitude: observation.location_point.lng,
                        }}
                        anchor={{x: 0.5, y: 1}}>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                        <Image source={require('assets/map-marker.png')} style={{width: 40, height: 40}} />
                      </Marker>
                    </ZoneMap>
                  )}
                  {observation.location_name && <TableRow label="Location" value={observation.location_name} />}
                  <TableRow label="Route" value={observation.route || 'Not specified'} />
                  <TableRow label="Activity" value={activityDisplayName(observation.activity)} />
                  {observation.observation_summary && <HTML source={{html: observation.observation_summary}} />}
                  <View pt={8}>
                    <BodySemibold>Signs of Instability</BodySemibold>
                  </View>
                  {/* Avalanche section */}
                  <HStack space={8}>
                    <NACIcon name="avalanche" size={bodySize} color={avalanches_observed ? colorFor(DangerLevel.High).string() : colorLookup('text')} />
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
              {images(observation.media).length > 0 && (
                <Card borderRadius={0} borderColor="white" header={<BodyBlack>Media</BodyBlack>}>
                  <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={images(observation.media)} displayCaptions={false} />
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
                          value={`${FormatAvalancheAspect(item.aspect as AvalancheAspect)}${item.slopeAngle ? `, ${item.slopeAngle}°` : ''} at ${withUnits(item.elevation, 'ft')}`}
                        />
                        {item.verticalFall && <TableRow label={'Vertical Fall'} value={`${withUnits(item.verticalFall, 'ft')}`} />}
                        {item.avgCrownDepth && <TableRow label={'Crown Thickness'} value={`${withUnits(item.avgCrownDepth, 'cm')}`} />}
                        {item.width && <TableRow label={'Width'} value={`${withUnits(item.width, 'ft')}`} />}
                        {item.avalancheType && <TableRow label={'Type'} value={FormatAvalancheType(item.avalancheType as AvalancheType)} />}
                        {item.verticalFall && <TableRow label={'Bed Surface'} value={FormatAvalancheBedSurface(item.bedSfc as AvalancheBedSurface)} />}
                        {images(item.media) && (
                          <VStack pt={8} space={8} width="100%">
                            <BodySemibold>Media</BodySemibold>
                            <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={images(item.media)} displayCaptions={false} />
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
                      {images(observation.advanced_fields.snowpack_media) && (
                        <Carousel thumbnailHeight={160} thumbnailAspectRatio={1.3} media={images(observation.advanced_fields.snowpack_media)} displayCaptions={false} />
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
