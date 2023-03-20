import React from 'react';

import {Feather, FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {Card} from 'components/content/Card';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {filtersForConfig, ObservationFilterConfig, ObservationsFilterForm, zone} from 'components/observations/ObservationsFilterForm';
import {Body, BodyBlack, BodySemibold, BodySmBlack, Caption1Black} from 'components/text';
import {compareDesc, parseISO, setDayOfYear, sub} from 'date-fns';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNWACObservations} from 'hooks/useNWACObservations';
import {OverviewFragment, useObservationsQuery} from 'hooks/useObservations';
import {useRefresh} from 'hooks/useRefresh';
import {FlatList, FlatListProps, Modal, RefreshControl, TouchableOpacity} from 'react-native';
import {ObservationsStackNavigationProps} from 'routes';
import theme, {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, PartnerType} from 'types/nationalAvalancheCenter';
import {notFound} from 'types/requests';
import {apiDateString, RequestedTime, requestedTimeToUTCDate, utcDateToLocalDateString} from 'utils/date';

interface ObservationsListViewItem {
  id: OverviewFragment['id'];
  observation: OverviewFragment;
  source: 'nwac' | 'nac';
  zone: string;
}

interface ObservationsListViewProps extends Omit<FlatListProps<ObservationsListViewItem>, 'data' | 'renderItem'> {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
  initialFilterConfig?: ObservationFilterConfig;
}

export const ObservationsListView: React.FunctionComponent<ObservationsListViewProps> = ({center_id, requestedTime, initialFilterConfig, ...props}) => {
  const originalFilterConfig: ObservationFilterConfig = {
    dates: {
      from: setDayOfYear(new Date(), 1),
      to: new Date(),
    },
    ...initialFilterConfig,
  };
  const [filterConfig, setFilterConfig] = React.useState<ObservationFilterConfig>(originalFilterConfig);
  const [filterModalVisible, setFilterModalVisible] = React.useState<boolean>(false);
  const mapResult = useMapLayer(center_id);
  const mapLayer = mapResult.data;

  const date = requestedTimeToUTCDate(requestedTime);
  const startDate = sub(date, {weeks: 2});
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

  observations.sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));

  // the displayed observations need to match all filters - for instance, if a user chooses a zone *and*
  // an observer type, we only show observations that match both of those at the same time
  const resolvedFilters = filtersForConfig(mapLayer, filterConfig);
  const displayedObservations: OverviewFragment[] = observations.filter(observation =>
    resolvedFilters.map(filter => filter(observation)).reduce((currentValue, accumulator) => accumulator && currentValue, true),
  );

  return (
    <>
      <Modal animationType={'fade'} visible={filterModalVisible}>
        <ObservationsFilterForm
          mapLayer={mapLayer}
          initialFilterConfig={originalFilterConfig}
          currentFilterConfig={filterConfig}
          setFilterConfig={setFilterConfig}
          setVisible={setFilterModalVisible}
        />
      </Modal>
      <FlatList
        ListHeaderComponent={
          <HStack px={16} pt={12} pb={12} space={24} backgroundColor={colorLookup('background.base')}>
            <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
              <HStack bg={'white'} px={12} py={8} space={8} borderRadius={30} borderWidth={1} style={{...theme.shadows['5']}}>
                <FontAwesome name="sliders" size={24} color="black" />
                <BodySemibold>Filters{resolvedFilters.length > 0 && ` (${resolvedFilters.length})`}</BodySemibold>
              </HStack>
            </TouchableOpacity>
          </HStack>
        }
        style={{backgroundColor: colorLookup('background.base'), width: '100%', height: '100%'}}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        data={
          displayedObservations.length > 1
            ? displayedObservations.map(observation => ({
                id: observation.id,
                observation: observation,
                source: nwacObservations?.getObservationList.map(o => o.id).includes(observation.id) ? 'nwac' : 'nac',
                zone: zone(mapLayer, observation.locationPoint?.lat, observation.locationPoint?.lng),
              }))
            : [{id: null, observation: null, source: null, zone: null}]
        }
        renderItem={({item}) =>
          item.id ? (
            <ObservationSummaryCard source={item.source} observation={item.observation} zone={item.zone} />
          ) : (
            <NotFound terminal what={[notFound('any matching observations')]} />
          )
        }
        {...props}
      />
    </>
  );
};

const colorsFor = (partnerType: PartnerType) => {
  switch (partnerType) {
    case 'forecaster':
    case 'intern':
      return {primary: '#0059C8', secondary: '#98CBFF'};
    case 'professional':
      return {primary: '#006D23', secondary: '#9ED696'};
    case 'volunteer':
    case 'public':
      return {primary: '#EA983F', secondary: 'rgba(234, 152, 63, 0.2)'};
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
          {observation.media && observation.media.length > 0 && (
            <NetworkImage width={52} height={52} uri={observation.media[0].url.thumbnail} imageStyle={{borderRadius: 4}} index={0} onPress={null} onStateChange={null} />
          )}
        </View>
      </HStack>
    </Card>
  );
};
