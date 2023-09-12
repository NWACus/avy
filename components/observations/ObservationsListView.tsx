import React, {useCallback} from 'react';

import {FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {Card} from 'components/content/Card';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {Center, HStack, View, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {filtersForConfig, ObservationFilterConfig, ObservationsFilterForm, zone} from 'components/observations/ObservationsFilterForm';
import {Body, BodyBlack, bodySize, BodySmBlack, Caption1Semibold} from 'components/text';
import {add, compareDesc, parseISO} from 'date-fns';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNACObservations} from 'hooks/useNACObservations';
import {useNWACObservations} from 'hooks/useNWACObservations';
import {DEFAULT_OBSERVATIONS_WINDOW} from 'hooks/useObservations';
import {useRefresh} from 'hooks/useRefresh';
import {ActivityIndicator, FlatList, FlatListProps, Modal, RefreshControl, TouchableOpacity} from 'react-native';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, MediaType, ObservationFragment, PartnerType} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTime, requestedTimeToUTCDate, utcDateToLocalDateString} from 'utils/date';

interface ObservationsListViewItem {
  id: ObservationFragment['id'];
  observation: ObservationFragment;
  source: string;
  zone: string;
}

interface ObservationsListViewProps extends Omit<FlatListProps<ObservationsListViewItem>, 'data' | 'renderItem'> {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
  initialFilterConfig?: ObservationFilterConfig;
}

interface ObservationFragmentWithPageIndex extends ObservationFragment {
  pageIndex: number;
}

export const ObservationsListView: React.FunctionComponent<ObservationsListViewProps> = ({center_id, requestedTime, initialFilterConfig, ...props}) => {
  const endDate = requestedTimeToUTCDate(requestedTime);
  const originalFilterConfig: ObservationFilterConfig = {
    dates: {
      from: add(endDate, DEFAULT_OBSERVATIONS_WINDOW),
      to: endDate,
    },
    ...initialFilterConfig,
  };
  const [filterConfig, setFilterConfig] = React.useState<ObservationFilterConfig>(originalFilterConfig);
  const [filterModalVisible, setFilterModalVisible] = React.useState<boolean>(false);
  const mapResult = useMapLayer(center_id);
  const mapLayer = mapResult.data;

  // TODO brian wire up duration correctly - there's an interaction between useInfiniteQuery (which has a cached
  // notion of whether there's more data) and this duration, and I'm not sure of the best way to solve it.
  // Right now, the queryKey in useNACObservations/useNWACObservations doesn't use the duration, so it's not invalidated when the duration changes.
  // That has the nice property of not re-fetching data when the duration changes, but it also means that if you make the duration longer, you won't get new data.
  const nacObservationsResult = useNACObservations(center_id, requestedTime, DEFAULT_OBSERVATIONS_WINDOW);
  const nacObservations: ObservationFragmentWithPageIndex[] = nacObservationsResult.data?.pages?.flatMap((page, index) => page.data.map(o => ({...o, pageIndex: index}))) ?? [];
  const nwacObservationsResult = useNWACObservations(center_id, requestedTime, DEFAULT_OBSERVATIONS_WINDOW);
  const nwacObservations: ObservationFragmentWithPageIndex[] = nwacObservationsResult.data?.pages?.flatMap((page, index) => page.data.map(o => ({...o, pageIndex: index}))) ?? [];
  const observations: ObservationFragmentWithPageIndex[] = nacObservations
    .concat(nwacObservations)
    .filter(observation => observation) // when nothing is returned from the NAC, we get a null
    // Sort observations by page index, then by date. This keeps old entries from shifting around as new data is fetched
    .sort((a, b) => {
      const pageDelta = a.pageIndex - b.pageIndex;
      if (pageDelta !== 0) {
        return pageDelta;
      }
      return compareDesc(parseISO(a.createdAt), parseISO(b.createdAt));
    })
    // sometimes, the NWAC API gives us duplicates. If this happens, prefer to keep the version that was fetched earlier
    .filter((v, i, a) => a.findIndex(v2 => v2.id === v.id) === i);
  const {isRefreshing, refresh} = useRefresh(mapResult.refetch, nacObservationsResult.refetch, nwacObservationsResult.refetch);

  const fetchMoreData = useCallback(async (observationsResult: ReturnType<typeof useNACObservations> | ReturnType<typeof useNWACObservations>) => {
    const {isFetchingNextPage} = observationsResult;
    let {hasNextPage, fetchNextPage} = observationsResult;
    if (isFetchingNextPage || !hasNextPage) {
      return;
    }

    // Fetch until we get to the end of the data, or get at least one item
    while (hasNextPage) {
      const pageResult = await fetchNextPage();
      if (!pageResult.hasNextPage) {
        break;
      }
      const fetchCount = pageResult.data?.pages[pageResult.data?.pages.length - 1].data?.length ?? 0;
      if (fetchCount > 0) {
        break;
      }
      hasNextPage = pageResult.hasNextPage;
      fetchNextPage = pageResult.fetchNextPage;
    }
  }, []);

  if (incompleteQueryState(nacObservationsResult, nwacObservationsResult, mapResult) || !observations || !mapLayer) {
    return <QueryState results={[nacObservationsResult, nwacObservationsResult, mapResult]} />;
  }

  // the displayed observations need to match all filters - for instance, if a user chooses a zone *and*
  // an observer type, we only show observations that match both of those at the same time
  const resolvedFilters = filtersForConfig(mapLayer, filterConfig, endDate);
  const displayedObservations: ObservationFragment[] = observations.filter(observation =>
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
        // when within 2 page lengths of the end, start fetching the next set of data
        onEndReachedThreshold={2}
        onEndReached={() => {
          void fetchMoreData(nwacObservationsResult);
          void fetchMoreData(nacObservationsResult);
        }}
        ListHeaderComponent={
          <HStack px={16} pt={12} pb={12} space={24} backgroundColor={colorLookup('background.base')}>
            <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
              <HStack bg={'white'} px={12} py={8} space={8} borderRadius={30} borderWidth={1}>
                <FontAwesome name="sliders" size={16} color={colorLookup('text')} />
                <BodySmBlack>Filters{resolvedFilters.length > 0 && ` (${resolvedFilters.length})`}</BodySmBlack>
              </HStack>
            </TouchableOpacity>
          </HStack>
        }
        ListFooterComponent={() => {
          if (!nacObservationsResult.hasNextPage && !nwacObservationsResult.hasNextPage) {
            return (
              <Center height={OBSERVATION_SUMMARY_CARD_HEIGHT}>
                <Body>
                  {/* this ad-hoc pluralization is sketchy, we should implement proper string localization / formatting with MessageFormat */}
                  {/* Note: the case of no results is handled by ListEmptyComponent below */}
                  {displayedObservations.length} observation{displayedObservations.length > 1 ? 's' : ''} in selected time period
                </Body>
              </Center>
            );
          } else if (nacObservationsResult.isFetchingNextPage || nwacObservationsResult.isFetchingNextPage) {
            return (
              <Center height={OBSERVATION_SUMMARY_CARD_HEIGHT}>
                <ActivityIndicator size={'large'} color={colorLookup('textColor')} />
              </Center>
            );
          } else {
            return null;
          }
        }}
        ListEmptyComponent={<NotFound inline terminal what={[new NotFoundError('no observations found', 'any matching observations')]} />}
        style={{backgroundColor: colorLookup('background.base'), width: '100%', height: '100%'}}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={void refresh} />}
        data={displayedObservations.map(observation => ({
          id: observation.id,
          observation: observation,
          source: nwacObservations.map(o => o.id).includes(observation.id) ? 'nwac' : 'nac',
          zone: zone(mapLayer, observation.locationPoint.lat, observation.locationPoint.lng),
        }))}
        getItemLayout={(data, index) => ({length: OBSERVATION_SUMMARY_CARD_HEIGHT, offset: OBSERVATION_SUMMARY_CARD_HEIGHT * index, index})}
        renderItem={({item}) => <ObservationSummaryCard source={item.source} observation={item.observation} zone={item.zone} />}
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
    case 'other':
      return {primary: '#EA983F', secondary: 'rgba(234, 152, 63, 0.2)'};
  }
  const invalid: never = partnerType;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown partner type: ${invalid}`);
};

export interface ObservationSummaryCardProps {
  source: string;
  observation: ObservationFragment;
  zone: string;
}

const OBSERVATION_SUMMARY_CARD_HEIGHT = 132;

export const ObservationSummaryCard: React.FunctionComponent<ObservationSummaryCardProps> = React.memo(({source, zone, observation}: ObservationSummaryCardProps) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const avalanches = observation.instability.avalanches_caught || observation.instability.avalanches_observed || observation.instability.avalanches_triggered;
  const redFlags = observation.instability.collapsing || observation.instability.cracking;
  return (
    <Card
      mx={8}
      my={2}
      py={4}
      borderRadius={10}
      borderColor={colorLookup('light.300')}
      borderWidth={1}
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
      header={
        <HStack alignContent="flex-start" justifyContent="space-between" flexWrap="wrap" alignItems="center" space={8}>
          <BodySmBlack>{utcDateToLocalDateString(observation.createdAt)}</BodySmBlack>
          <HStack space={8} alignItems="center">
            {redFlags && <MaterialCommunityIcons name="flag" size={bodySize} color={colorFor(DangerLevel.Considerable).string()} />}
            {avalanches && <NACIcon name="avalanche" size={bodySize} color={colorFor(DangerLevel.High).string()} />}
            <Caption1Semibold color={colorsFor(observation.observerType).primary} style={{textTransform: 'uppercase'}}>
              {observation.observerType}
            </Caption1Semibold>
          </HStack>
        </HStack>
      }>
      <HStack space={48} justifyContent="space-between" alignItems={'flex-start'}>
        <VStack space={4} alignItems={'flex-start'} flex={1}>
          <BodyBlack>{zone}</BodyBlack>
          <Body color="text.secondary" numberOfLines={1}>
            {observation.locationName}
          </Body>
        </VStack>
        <View width={52} height={52} flex={0} ml={8}>
          {observation.media && observation.media.length > 0 && observation.media[0].type === MediaType.Image && observation.media[0].url?.thumbnail && (
            <NetworkImage width={52} height={52} uri={observation.media[0].url.thumbnail} imageStyle={{borderRadius: 4}} index={0} onPress={undefined} onStateChange={undefined} />
          )}
        </View>
      </HStack>
    </Card>
  );
});
ObservationSummaryCard.displayName = 'ObservationSummaryCard';
