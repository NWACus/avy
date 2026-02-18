import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {FormattedMessage} from 'react-intl';

import {FontAwesome, MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {colorFor} from 'components/AvalancheDangerTriangle';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {NotFound, QueryState, incompleteQueryState} from 'components/content/QueryState';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {Center, Divider, HStack, VStack, View} from 'components/core';
import {NACAvalancheIcon} from 'components/icons/nac-icons';
import {ObservationFilterConfig, ObservationsFilterForm, createDefaultFilterConfig, filtersForConfig, matchesZone} from 'components/observations/ObservationsFilterForm';
import {usePendingObservations} from 'components/observations/uploader/usePendingObservations';
import {Body, BodyBlack, BodySm, BodySmBlack, BodyXSm, Caption1Semibold, bodySize, bodyXSmSize} from 'components/text';
import {compareDesc, formatDuration, isBefore, parseISO, sub} from 'date-fns';
import {useMapLayer} from 'hooks/useMapLayer';
import {useNACObservations} from 'hooks/useNACObservations';
import {useNWACObservations} from 'hooks/useNWACObservations';
import {useRefresh} from 'hooks/useRefresh';
import {useToggle} from 'hooks/useToggle';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {usePostHog} from 'posthog-react-native';
import {
  ActivityIndicator,
  ColorValue,
  GestureResponderEvent,
  LayoutAnimation,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  SectionList,
  SectionListRenderItemInfo,
  TouchableOpacity,
} from 'react-native';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, DangerLevel, MediaType, ObservationFragment, PartnerType} from 'types/nationalAvalancheCenter';
import {RequestedTime, observationDateToLocalDateString, requestedTimeToUTCDate} from 'utils/date';

interface ObservationsListViewItem {
  id: ObservationFragment['id'];
  observation: ObservationFragment;
  source: string;
  zone: string;
  pending?: boolean;
}

interface ObservationsListViewProps {
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
  additionalFilters?: Partial<ObservationFilterConfig>;
}

interface ObservationFragmentWithPageIndex extends ObservationFragment {
  pageIndex: number;
}

type SourceType = 'nac' | 'nwac';

interface ObservationFragmentWithPageIndexAndZoneAndSource extends ObservationFragmentWithPageIndex {
  zone: string;
  source: SourceType;
}

export const ObservationsListView: React.FunctionComponent<ObservationsListViewProps> = ({center_id, requestedTime, additionalFilters}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const endDate = requestedTimeToUTCDate(requestedTime);
  const originalFilterConfig: ObservationFilterConfig = useMemo(() => createDefaultFilterConfig(additionalFilters), [additionalFilters]);
  const [filterConfig, setFilterConfig] = useState<ObservationFilterConfig>(originalFilterConfig);
  const [filterModalVisible, {set: setFilterModalVisible, on: showFilterModal, off: hideFilterModal}] = useToggle(false);
  const mapResult = useMapLayer(center_id);
  const mapLayer = mapResult.data;

  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id) {
      postHog.screen('observations', {
        center: center_id,
        zone: additionalFilters && additionalFilters.zones && additionalFilters.zones.length > 0 ? additionalFilters.zones[0] : 'global',
      });
    }
  }, [postHog, additionalFilters, center_id]);
  useFocusEffect(recordAnalytics);

  // Filter inputs changed via render props should overwrite our current state
  useEffect(() => {
    setFilterConfig(current => ({
      ...current,
      ...additionalFilters,
    }));
  }, [additionalFilters]);

  // From the 2023-24 season onward, we will only have NAC observations
  const displayNWACObservations = center_id === 'NWAC' && endDate < new Date('2023-09-01');
  const nacObservationsResult = useNACObservations(center_id, requestedTime, {
    enabled: !displayNWACObservations,
  });
  const nwacObservationsResult = useNWACObservations(center_id, requestedTime, {
    enabled: displayNWACObservations,
  });

  const observationsResult = displayNWACObservations ? nwacObservationsResult : nacObservationsResult;

  const flatObservationList: ObservationFragmentWithPageIndex[] = useMemo(
    () =>
      (observationsResult.data?.pages ?? []).flatMap((page, index) =>
        page.data.map(o => ({
          ...o,
          pageIndex: index,
        })),
      ),
    [observationsResult],
  );
  const observations: ObservationFragmentWithPageIndexAndZoneAndSource[] = useMemo(
    () =>
      flatObservationList
        .map(observation => ({
          ...observation,
          source: displayNWACObservations ? 'nwac' : ('nac' as SourceType),
        }))
        .filter(observation => observation) // when nothing is returned from the NAC, we get a null
        // Sort observations by page index, then by date. This keeps old entries from shifting around as new data is fetched
        .sort((a, b) => {
          const pageDelta = a.pageIndex - b.pageIndex;
          if (pageDelta !== 0) {
            return pageDelta;
          }
          return compareDesc(parseISO(a.startDate), parseISO(b.startDate));
        })
        // sometimes, the NWAC API gives us duplicates. If this happens, prefer to keep the version that was fetched earlier
        .filter((v, i, a) => a.findIndex(v2 => v2.id === v.id) === i)
        // calculate the zone and cache it now
        .map(observation => ({
          ...observation,
          zone: mapLayer ? matchesZone(mapLayer, observation.locationPoint.lat, observation.locationPoint.lng) : '',
        })),
    [flatObservationList, mapLayer, displayNWACObservations],
  );
  const {isRefreshing, refresh} = useRefresh(observationsResult.refetch);
  const refreshWrapper = useCallback(() => void refresh(), [refresh]);

  // the displayed observations need to match all filters - for instance, if a user chooses a zone *and*
  // an observer type, we only show observations that match both of those at the same time
  const resolvedFilters = useMemo(() => (mapLayer ? filtersForConfig(mapLayer, filterConfig, additionalFilters) : []), [mapLayer, filterConfig, additionalFilters]);

  // Set a date limit for how far back to look for observations
  const [lookBackLimit, setLookBackLimit] = useState<Duration>({years: 1});

  const fetchMoreData = useCallback(() => {
    void (async () => {
      const {isFetchingNextPage} = observationsResult;
      let {hasNextPage, fetchNextPage} = observationsResult;
      if (isFetchingNextPage || !hasNextPage) {
        return;
      }

      const dateLimit = sub(Date.now(), lookBackLimit);
      logger.debug(`fetchMoreData dateLimit: ${new Date(dateLimit).toISOString()}`);

      // Fetch until we get to the end of the data, or get at least one item
      while (hasNextPage) {
        const pageResult = await fetchNextPage();
        if (!pageResult.hasNextPage) {
          break;
        }
        const fetchCount = pageResult.data?.pages.at(-1)?.data?.filter(observation => resolvedFilters.every(({filter}) => filter(observation))).length ?? 0;
        if (fetchCount > 0) {
          logger.debug('fetchMoreData exiting because of fetchCount');
          break;
        }
        hasNextPage = pageResult.hasNextPage;

        const fetchDate = pageResult.data?.pages.at(-1)?.endDate;
        if (fetchDate && isBefore(new Date(fetchDate), dateLimit)) {
          logger.debug(`fetchMoreData exiting because of fetchDate: ${fetchDate && new Date(fetchDate).toISOString()}`);
          break;
        }

        fetchNextPage = pageResult.fetchNextPage;
      }
    })();
  }, [observationsResult, resolvedFilters, logger, lookBackLimit]);

  const increaseLookBackLimit = useCallback(() => {
    // Doubles the current lookBackLimit
    const currentMonths = (lookBackLimit.years ?? 0) * 12 + (lookBackLimit.months ?? 0);
    const newMonths = currentMonths * 2;
    setLookBackLimit({years: Math.floor(newMonths / 12), months: newMonths % 12});

    fetchMoreData();
  }, [lookBackLimit, fetchMoreData]);

  interface Section {
    title: string;
    data: ObservationsListViewItem[];
  }

  const pendingObservations = usePendingObservations();
  const pendingObservationsSection: Section = useMemo(
    () => ({
      title: 'Pending',
      data: pendingObservations.map(
        ({observation}) =>
          ({
            id: observation.id,
            observation: observation,
            source: 'nac',
            zone: observation.locationName,
            pending: true,
          } as const),
      ),
    }),
    [pendingObservations],
  );

  const observationsSection: Section = useMemo(
    () => ({
      title: 'Published Results',
      data: observations
        .filter(observation => resolvedFilters.every(({filter}) => filter(observation)))
        .map(
          observation =>
            ({
              id: observation.id,
              observation: observation,
              source: observation.source,
              zone: observation.zone,
            } as const),
        ),
    }),
    [observations, resolvedFilters],
  );

  const hasPendingObservations = pendingObservationsSection.data.length > 0;

  const sections: Section[] = useMemo(() => {
    return [pendingObservationsSection, observationsSection].filter(section => section.data.length > 0);
  }, [pendingObservationsSection, observationsSection]);

  const renderItem = useCallback(
    ({item}: SectionListRenderItemInfo<ObservationsListViewItem, Section>) => (
      <ObservationSummaryCard source={item.source} observation={item.observation} zone={item.zone} pending={item.pending} />
    ),
    [],
  );

  const submit = useCallback(() => {
    navigation.navigate('observationSubmit', {center_id});
  }, [navigation, center_id]);

  const [showSubmitButtonText, setShowSubmitButtonText] = useState(true);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextShowSubmitButtonText = event.nativeEvent.contentOffset.y < 160;
      setShowSubmitButtonText(nextShowSubmitButtonText);
    },
    [setShowSubmitButtonText],
  );
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [showSubmitButtonText]);
  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: OBSERVATION_SUMMARY_CARD_HEIGHT,
      offset: OBSERVATION_SUMMARY_CARD_HEIGHT * index,
      index,
    }),
    [],
  );
  const renderListFooter = useCallback(() => {
    if (observationsResult.isFetchingNextPage) {
      return (
        <Center height={OBSERVATION_SUMMARY_CARD_HEIGHT} paddingBottom={48}>
          <ActivityIndicator size={'large'} color={colorLookup('text.secondary')} />
        </Center>
      );
    }
    return (
      <Center height={OBSERVATION_SUMMARY_CARD_HEIGHT} paddingBottom={48}>
        <Body>
          <FormattedMessage
            description="How many observations were found."
            defaultMessage="{count, plural,
  =0 {No observations match the filters.}
  one {One observation matches the filters.}
  other {# observations match the filters.}}"
            values={{
              count: observationsSection.data.length,
            }}
          />
        </Body>
      </Center>
    );
  }, [observationsSection.data.length, observationsResult.isFetchingNextPage]);
  const renderSectionHeader = useCallback(
    ({section: {title}}: {section: {title: string}}) =>
      hasPendingObservations ? (
        <View px={16} py={8}>
          <BodySm>{title}</BodySm>
        </View>
      ) : null,
    [hasPendingObservations],
  );

  const applyFilterRemoval = useCallback(
    (removeFilter: (config: ObservationFilterConfig) => ObservationFilterConfig) => {
      return () => setFilterConfig(removeFilter(filterConfig));
    },
    [filterConfig, setFilterConfig],
  );

  if (incompleteQueryState(observationsResult, mapResult) || !mapLayer) {
    return (
      <Center width="100%" height="100%">
        <QueryState results={[observationsResult, mapResult]} />
      </Center>
    );
  }

  // Get a count of the number of user-defined filters that can be removed; this is used as the badge count
  const optionalFilterCount = resolvedFilters.filter(value => value.removeFilter !== undefined).length;

  return (
    <VStack width="100%" height="100%" space={0}>
      <Modal visible={filterModalVisible} onRequestClose={hideFilterModal} presentationStyle="overFullScreen">
        <ObservationsFilterForm
          requestedTime={requestedTime}
          mapLayer={mapLayer}
          initialFilterConfig={originalFilterConfig}
          currentFilterConfig={filterConfig}
          setFilterConfig={setFilterConfig}
          setVisible={setFilterModalVisible}
        />
      </Modal>
      <HStack space={8} pb={8} pl={16} justifyContent="space-between" width="100%">
        <FilterPillButton
          label="Filters"
          textColor={colorLookup('primary')}
          backgroundColor={colorLookup('white')}
          onPress={showFilterModal}
          headIcon={<FontAwesome name="sliders" size={bodyXSmSize} color={colorLookup('primary')} style={{marginRight: 2}} />}
          tailIcon={
            optionalFilterCount > 0 && (
              <Center backgroundColor={colorLookup('primary')} width={14} height={14} borderRadius={7} minWidth={bodyXSmSize}>
                <BodyXSm color={'white'} fontSize={10} lineHeight={14}>
                  {optionalFilterCount}
                </BodyXSm>
              </Center>
            )
          }
        />
        <Divider direction="vertical" />
        <ScrollView horizontal style={{width: '100%'}} showsHorizontalScrollIndicator={false}>
          <HStack space={8} py={4} pr={16}>
            {resolvedFilters.map(({label, removeFilter, type: filterType}) => {
              const canBeDeleted = removeFilter !== undefined;
              const textColor = colorLookup('primary');
              const backgroundColor = colorLookup('white');
              const tailIcon = canBeDeleted ? (
                <MaterialCommunityIcons name="close" size={16} style={{marginTop: 2, marginHorizontal: 0}} color={colorLookup('primary')} />
              ) : filterType === 'date' ? (
                <MaterialCommunityIcons name="chevron-down" size={16} style={{marginTop: 2, marginHorizontal: 0}} color={colorLookup('primary')} />
              ) : undefined;
              return (
                <FilterPillButton
                  key={label}
                  label={label}
                  textColor={textColor}
                  backgroundColor={backgroundColor}
                  tailIcon={tailIcon}
                  onPress={removeFilter ? applyFilterRemoval(removeFilter) : showFilterModal}
                />
              );
            })}
          </HStack>
        </ScrollView>
      </HStack>
      <Divider />
      <SectionList
        sections={sections}
        renderSectionHeader={renderSectionHeader}
        onScroll={onScroll}
        onScrollEndDrag={onScroll}
        scrollEventThrottle={160}
        onEndReachedThreshold={0.5}
        onEndReached={fetchMoreData}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={
          observationsResult.isFetching ? (
            <Center height={'100%'}>
              <VStack alignItems="center" space={8}>
                <ActivityIndicator size={'large'} color={colorLookup('text.secondary')} />
                <BodySm color={colorLookup('text.secondary')}>Searching for matching observations...</BodySm>
              </VStack>
            </Center>
          ) : (
            <Center height={'100%'} bg="white">
              <NotFound inline terminal body={`No results found in the last ${formatDuration(lookBackLimit)}.`} />
              <Button onPress={increaseLookBackLimit}>Increase date range</Button>
            </Center>
          )
        }
        contentContainerStyle={{flexGrow: 1}}
        style={{backgroundColor: colorLookup('primary.background'), width: '100%', height: '100%'}}
        refreshing={isRefreshing}
        onRefresh={refreshWrapper}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
      />
      <HStack position="absolute" bottom={16} right={16} justifyContent="flex-end">
        {/* Padding numbers are carefully chosen to center things, and to make the button perfectly round
        when the text is hidden. Expo icons are never vertically centered correctly by default for some reason. */}
        <Button buttonStyle="primary" onPress={submit} borderRadius={32} paddingHorizontal={13}>
          {/* setting the key property to force re-render of the HStack when showSubmitButtonText change.
          also, I hate the platform specific padding value here but I don't have time to dig into the rendering differences right now.
           */}
          <HStack alignItems="center" space={4} key={showSubmitButtonText ? 'show' : 'hide'} pt={Platform.OS === 'android' ? 0 : 4} pl={1} pr={1}>
            <MaterialIcons name="add" size={24} color="white" />
            {showSubmitButtonText && <BodySmBlack color="white">Submit</BodySmBlack>}
          </HStack>
        </Button>
      </HStack>
    </VStack>
  );
};

const colorsFor = (partnerType: PartnerType) => {
  return {
    primary: colorLookup(`observer.${partnerType}.primary`).toString(),
    secondary: colorLookup(`observer.${partnerType}.secondary`).toString(),
  };
};

export interface FilterPillButtonProps {
  label: string;
  headIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  textColor: ColorValue;
  backgroundColor: ColorValue;
}

export const FilterPillButton: React.FC<FilterPillButtonProps> = ({label, headIcon, tailIcon, onPress, textColor, backgroundColor}) => (
  <TouchableOpacity onPress={onPress}>
    <HStack
      bg={backgroundColor}
      px={8}
      py={2}
      space={4}
      borderRadius={30}
      borderWidth={0.5}
      borderColor={textColor}
      alignItems="center"
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,

        elevation: 2,
      }}>
      {headIcon}
      <BodyXSm color={textColor}>{label}</BodyXSm>
      {tailIcon}
    </HStack>
  </TouchableOpacity>
);

export interface ObservationSummaryCardProps {
  source: string;
  observation: ObservationFragment;
  zone: string;
  pending?: boolean;
}

const OBSERVATION_SUMMARY_CARD_HEIGHT = 132;

export const ObservationSummaryCard: React.FunctionComponent<ObservationSummaryCardProps> = React.memo(({source, zone, observation, pending}: ObservationSummaryCardProps) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const avalanches = observation.instability.avalanches_caught || observation.instability.avalanches_observed || observation.instability.avalanches_triggered;
  const redFlags = observation.instability.collapsing || observation.instability.cracking;
  const onPress = useCallback(() => {
    if (source === 'nwac') {
      navigation.navigate('nwacObservation', {
        id: observation.id,
      });
    } else {
      navigation.navigate('observation', {
        id: observation.id,
      });
    }
  }, [navigation, source, observation.id]);

  let thumbnail = '';
  if (observation.media && observation.media.length > 0) {
    for (const item of observation.media) {
      if (item.type === MediaType.Image && item.url?.thumbnail) {
        thumbnail = item.url?.thumbnail;
        break;
      }
    }
  }

  return (
    <Card
      mx={8}
      my={2}
      py={4}
      borderRadius={10}
      borderColor={colorLookup('light.300')}
      borderWidth={1}
      onPress={pending ? undefined : onPress}
      style={{opacity: pending ? 0.5 : 1.0}}
      header={
        <HStack alignContent="flex-start" justifyContent="space-between" flexWrap="wrap" alignItems="center" space={8}>
          <BodySmBlack>{observationDateToLocalDateString(observation.startDate)}</BodySmBlack>
          <HStack space={8} alignItems="center">
            {redFlags && <MaterialCommunityIcons name="flag" size={bodySize} color={colorFor(DangerLevel.Considerable).string()} />}
            {avalanches && <NACAvalancheIcon size={bodySize} color={colorFor(DangerLevel.High).string()} />}
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
          {thumbnail && <NetworkImage width={52} height={52} uri={thumbnail} imageStyle={{borderRadius: 4}} index={0} onPress={undefined} onStateChange={undefined} />}
        </View>
      </HStack>
    </Card>
  );
});
ObservationSummaryCard.displayName = 'ObservationSummaryCard';
