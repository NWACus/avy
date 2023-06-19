import React from 'react';

import {Feather, FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {colorFor} from 'components/AvalancheDangerPyramid';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {incompleteQueryState, NotFound, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {NACIcon} from 'components/icons/nac-icons';
import {filtersForConfig, ObservationFilterConfig, ObservationsFilterForm, zone} from 'components/observations/ObservationsFilterForm';
import {Body, BodyBlack, BodySemibold, BodySmBlack, Caption1Black} from 'components/text';
import {compareDesc, parseISO, setDayOfYear} from 'date-fns';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNACObservations} from 'hooks/useNACObservations';
import {useNWACObservations} from 'hooks/useNWACObservations';
import {useRefresh} from 'hooks/useRefresh';
import {ActivityIndicator, FlatList, FlatListProps, Modal, RefreshControl, TouchableOpacity} from 'react-native';
import {ObservationsStackNavigationProps} from 'routes';
import theme, {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, MediaType, ObservationFragment, PartnerType} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTime, utcDateToLocalDateString} from 'utils/date';

interface ObservationsListViewItem {
  id?: ObservationFragment['id'];
  observation?: ObservationFragment;
  source?: string;
  zone?: string;
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
  const resolvedFilters = filtersForConfig(mapLayer, filterConfig);
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
              <HStack bg={'white'} px={12} py={8} space={8} borderRadius={30} borderWidth={1} style={{...theme.shadows['5']}}>
                <FontAwesome name="sliders" size={24} color="black" />
                <BodySemibold>Filters{resolvedFilters.length > 0 && ` (${resolvedFilters.length})`}</BodySemibold>
              </HStack>
            </TouchableOpacity>
          </HStack>
        }
        ListFooterComponent={
          <>
            {nacObservationsResult.isFetchingNextPage || nwacObservationsResult.isFetchingNextPage ? (
              <View borderRadius={8} py={12} px={16}>
                <HStack width={'100%'} space={8} justifyContent={'center'} alignItems={'center'}>
                  <BodyBlack>Loading more...</BodyBlack>
                  <ActivityIndicator />
                </HStack>
              </View>
            ) : (
              (nacObservationsResult.hasNextPage || nwacObservationsResult.hasNextPage) && (
                <HStack justifyContent="center">
                  <Button
                    width={'50%'}
                    buttonStyle={'primary'}
                    onPress={() => {
                      void nwacObservationsResult.fetchNextPage();
                      void nacObservationsResult.fetchNextPage();
                    }}>
                    <BodyBlack>Load more...</BodyBlack>
                  </Button>
                </HStack>
              )
            )}
          </>
        }
        style={{backgroundColor: colorLookup('background.base'), width: '100%', height: '100%'}}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={void refresh} />}
        data={
          displayedObservations.length > 0
            ? displayedObservations.map(observation => ({
                id: observation.id,
                observation: observation,
                source: nwacObservations.map(o => o.id).includes(observation.id) ? 'nwac' : 'nac',
                zone: zone(mapLayer, observation.locationPoint.lat, observation.locationPoint.lng),
              }))
            : [{}]
        }
        renderItem={({item}) =>
          item.id && item.observation && item.source && item.zone ? (
            <ObservationSummaryCard source={item.source} observation={item.observation} zone={item.zone} />
          ) : (
            <NotFound inline terminal what={[new NotFoundError('no observations found', 'any matching observations')]} />
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
    case 'other':
      return {primary: '#EA983F', secondary: 'rgba(234, 152, 63, 0.2)'};
  }
  const invalid: never = partnerType;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown partner type: ${invalid}`);
};

export const ObservationSummaryCard: React.FunctionComponent<{
  source: string;
  observation: ObservationFragment;
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
          <View px={8} py={6} borderRadius={12} backgroundColor={colorsFor(observation.observerType).secondary}>
            <HStack space={8}>
              <View height={12} width={12} borderRadius={6} backgroundColor={colorsFor(observation.observerType).primary} />
              <Caption1Black style={{textTransform: 'uppercase', color: colorsFor(observation.observerType).primary}}>{observation.observerType}</Caption1Black>
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
          {observation.media && observation.media.length > 0 && observation.media[0].type === MediaType.Image && observation.media[0].url?.thumbnail && (
            <NetworkImage width={52} height={52} uri={observation.media[0].url.thumbnail} imageStyle={{borderRadius: 4}} index={0} onPress={undefined} onStateChange={undefined} />
          )}
        </View>
      </HStack>
    </Card>
  );
};
