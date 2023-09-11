import React from 'react';

import {FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {filtersForConfig, ObservationFilterConfig, ObservationsFilterForm, zone} from 'components/observations/ObservationsFilterForm';
import {Body, BodyBlack, bodySize, BodySmBlack, Caption1Semibold} from 'components/text';
import {compareDesc, parseISO, setDayOfYear} from 'date-fns';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNACObservations} from 'hooks/useNACObservations';
import {useNWACObservations} from 'hooks/useNWACObservations';
import {useRefresh} from 'hooks/useRefresh';
import {FlatList, FlatListProps, Modal, RefreshControl, TouchableOpacity} from 'react-native';
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

export const ObservationsListView: React.FunctionComponent<ObservationsListViewProps> = ({center_id, requestedTime, initialFilterConfig, ...props}) => {
  const endDate = requestedTimeToUTCDate(requestedTime);
  const originalFilterConfig: ObservationFilterConfig = {
    dates: {
      from: setDayOfYear(endDate, 1),
      to: endDate,
    },
    ...initialFilterConfig,
  };
  const [filterConfig, setFilterConfig] = React.useState<ObservationFilterConfig>(originalFilterConfig);
  const [filterModalVisible, setFilterModalVisible] = React.useState<boolean>(false);
  const mapResult = useMapLayer(center_id);
  const mapLayer = mapResult.data;

  const nacObservationsResult = useNACObservations(center_id, requestedTime);
  const nacObservations: ObservationFragment[] = nacObservationsResult.data?.pages?.flatMap(page => page.data) ?? [];
  const nwacObservationsResult = useNWACObservations(center_id, requestedTime);
  const nwacObservations: ObservationFragment[] = nwacObservationsResult.data?.pages?.flatMap(page => page.data) ?? [];
  const observations: ObservationFragment[] = nacObservations
    .concat(nwacObservations)
    .filter(observation => observation) // when nothing is returned from the NAC, we get a null
    .filter((v, i, a) => a.findIndex(v2 => v2.id === v.id) === i); // sometimes, the NWAC API gives us duplicates
  const {isRefreshing, refresh} = useRefresh(mapResult.refetch, nacObservationsResult.refetch, nwacObservationsResult.refetch);

  if (incompleteQueryState(nacObservationsResult, nwacObservationsResult, mapResult) || !observations || !mapLayer) {
    return <QueryState results={[nacObservationsResult, nwacObservationsResult, mapResult]} />;
  }

  observations.sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));

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
        ListFooterComponent={
          nacObservationsResult.hasNextPage || nwacObservationsResult.hasNextPage ? (
            <HStack justifyContent="center" mt={4}>
              <Button
                width={'50%'}
                buttonStyle={'primary'}
                disabled={nacObservationsResult.isFetchingNextPage || nwacObservationsResult.isFetchingNextPage}
                busy={nacObservationsResult.isFetchingNextPage || nwacObservationsResult.isFetchingNextPage}
                onPress={() => {
                  void nwacObservationsResult.fetchNextPage();
                  void nacObservationsResult.fetchNextPage();
                }}>
                <BodyBlack>Load more...</BodyBlack>
              </Button>
            </HStack>
          ) : null
        }
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
