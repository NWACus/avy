import log from 'logger';
import React from 'react';

import {Feather, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {Card} from 'components/content/Card';
import {Carousel} from 'components/content/carousel';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {Body, BodyBlack, BodySmBlack, Caption1Black} from 'components/text';
import {geoContains} from 'd3-geo';
import {compareDesc, parseISO, sub} from 'date-fns';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNWACObservations} from 'hooks/useNWACObservations';
import {OverviewFragment, useObservationsQuery} from 'hooks/useObservations';
import {useRefresh} from 'hooks/useRefresh';
import {FlatList, FlatListProps, RefreshControl} from 'react-native';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, MapLayer, PartnerType} from 'types/nationalAvalancheCenter';
import {notFound} from 'types/requests';
import {apiDateString, RequestedTime, requestedTimeToUTCDate, utcDateToLocalDateString} from 'utils/date';

// TODO: we could show the Avy center logo for obs that come from forecasters

interface ObservationsListViewItem {
  id: OverviewFragment['id'];
  observation: OverviewFragment;
  source: 'nwac' | 'nac';
  zone: string;
}

interface ObservationsListViewProps extends Omit<FlatListProps<ObservationsListViewItem>, 'data' | 'renderItem'> {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
  zone_name?: string;
}

export const ObservationsListView: React.FunctionComponent<ObservationsListViewProps> = ({center_id, requestedTime, zone_name, ...props}) => {
  const mapResult = useMapLayer(center_id);
  const mapLayer = mapResult.data;

  const date = requestedTimeToUTCDate(requestedTime);
  const startDate = sub(date, {weeks: 1});
  const endDate = date;
  const observationsResult = useObservationsQuery({
    center: center_id,
    startDate: apiDateString(startDate),
    endDate: apiDateString(endDate),
  });
  const nacObservations = observationsResult.data;
  const nwacObservationsResult = useNWACObservations(center_id, startDate, endDate);
  const nwacObservations = nwacObservationsResult.data;
  const observations = nacObservations?.getObservationList.concat(nwacObservations?.getObservationList);
  const {isRefreshing, refresh} = useRefresh(mapResult.refetch, observationsResult.refetch, nwacObservationsResult.refetch);

  if (incompleteQueryState(observationsResult, nwacObservationsResult, mapResult)) {
    return <QueryState results={[observationsResult, nwacObservationsResult, mapResult]} />;
  }

  if (!observations || observations.length === 0) {
    return <NotFound what={[notFound('observations')]} />;
  }

  observations.sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));

  let displayedObservations: OverviewFragment[] = [];
  if (zone_name) {
    displayedObservations = observations.filter(observation => zone(mapLayer, observation.locationPoint?.lat, observation.locationPoint?.lng) === zone_name);
  } else {
    displayedObservations = observations;
  }

  if (!displayedObservations || displayedObservations.length === 0) {
    return <NotFound what={[notFound('observations')]} />;
  }

  return (
    <FlatList
      style={{backgroundColor: colorLookup('background.base')}}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      data={displayedObservations.map(observation => ({
        id: observation.id,
        observation: observation,
        source: nwacObservations?.getObservationList.map(o => o.id).includes(observation.id) ? 'nwac' : 'nac',
        zone: zone(mapLayer, observation.locationPoint?.lat, observation.locationPoint?.lng),
      }))}
      renderItem={({item}) => <ObservationSummaryCard source={item.source} observation={item.observation} zone={item.zone} />}
      {...props}
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
    log.info(`(${long},${lat}) matched ${matchingFeatures.length} features: ${matchingFeatures}`);
  }
  return matchingFeatures[0];
};

const colorsFor = (partnerType: PartnerType) => {
  switch (partnerType) {
    case 'forecaster':
    case 'intern':
    case 'professional':
      return {primary: '#EA983F', secondary: 'rgba(234, 152, 63, 0.2)'};
    case 'volunteer':
    case 'public':
      return {primary: '#006FFD', secondary: '#EAF2FF'};
  }
  // const invalid: never = partnerType;
  // throw new Error(`Unknown partner type: ${invalid}`);
};

export const ObservationSummaryCard: React.FunctionComponent<{
  source: string;
  observation: OverviewFragment;
  zone: string;
}> = ({source, zone, observation}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const avalanches = observation.instability.avalanches_caught || observation.instability.avalanches_observed || observation.instability.avalanches_triggered;
  const redFlags = observation.instability.collapsing || observation.instability.cracking;
  return (
    <Card
      mx={8}
      px={8}
      my={2}
      py={4}
      borderRadius={10}
      borderColor="white"
      onPress={() => {
        if (source === 'nwac') {
          navigation.navigate('nwacObservation', {
            id: observation.id,
          });
        } else {
          navigation.navigate('observation', {
            id: observation.id,
          });
        }
      }}
      noDivider
      header={
        <HStack alignContent="flex-start" justifyContent="space-between" flexWrap="wrap" alignItems="center" space={8}>
          <BodySmBlack>{utcDateToLocalDateString(observation.createdAt)}</BodySmBlack>
          <View px={8} py={6} borderRadius={12} backgroundColor={colorsFor(observation.observerType as PartnerType).secondary}>
            <HStack space={8}>
              <View height={12} width={12} borderRadius={6} backgroundColor={colorsFor(observation.observerType as PartnerType).primary} />
              <Caption1Black style={{textTransform: 'uppercase', color: colorsFor(observation.observerType as PartnerType).primary}}>{observation.observerType}</Caption1Black>
            </HStack>
          </View>
        </HStack>
      }>
      <HStack space={48} justifyContent="space-between" alignItems={'flex-start'}>
        <HStack space={8} alignItems={'flex-start'} flex={1}>
          <Feather name="map-pin" size={20} color="black" />
          <VStack space={4} alignItems={'flex-start'} flex={1}>
            <BodyBlack>{zone}</BodyBlack>
            <Body>{observation.locationName}</Body>
            <HStack space={8}>
              {redFlags && <MaterialCommunityIcons name="flag" size={24} color={colorFor(DangerLevel.Considerable).string()} />}
              {avalanches && <NACIcon name="avalanche" size={24} color={colorFor(DangerLevel.High).string()} />}
            </HStack>
          </VStack>
        </HStack>
        <View width={52} flex={0} mx={8}>
          {observation.media && observation.media.length > 0 && <Carousel thumbnailHeight={52} thumbnailAspectRatio={1} media={[observation.media[0]]} displayCaptions={false} />}
        </View>
      </HStack>
    </Card>
  );
};
