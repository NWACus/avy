import {FontAwesome, MaterialCommunityIcons} from '@expo/vector-icons';
import {useFocusEffect} from '@react-navigation/native';
import {NotFound} from 'components/content/QueryState';
import {Divider, HStack, VStack, View} from 'components/core';
import {FilterPillButton} from 'components/observations/ObservationsListView';
import {WeatherStationFilterConfig, WeatherStationFilterForm, filtersForConfig} from 'components/weather_data/WeatherStationFilterForm';
import {WeatherStationCard} from 'components/weather_data/WeatherStationMap';
import {useToggle} from 'hooks/useToggle';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback, useMemo} from 'react';
import {FlatList, ListRenderItemInfo, Modal, ScrollView, TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheCenterID, MapLayerFeature, WeatherStation, WeatherStationCollection, WeatherStationTimeseriesEntry} from 'types/nationalAvalancheCenter';
import {NotFoundError} from 'types/requests';
import {RequestedTimeString, parseRequestedTimeString, requestedTimeToUTCDate} from 'utils/date';

interface WeatherStationListItem {
  station: WeatherStation;
  timeseries?: WeatherStationTimeseriesEntry;
}

export const WeatherStationList: React.FunctionComponent<{
  mapLayerFeatures: MapLayerFeature[];
  weatherStations: WeatherStationCollection;
  center_id: AvalancheCenterID;
  requestedTime: RequestedTimeString;
  toggleMap: () => void;
  initialFilterConfig?: WeatherStationFilterConfig;
}> = ({mapLayerFeatures, weatherStations, center_id, requestedTime, toggleMap, initialFilterConfig}) => {
  const parsedTime = parseRequestedTimeString(requestedTime);
  const currentTime = requestedTimeToUTCDate(parsedTime);
  const [filterConfig, setFilterConfig] = React.useState<WeatherStationFilterConfig>({...initialFilterConfig});
  const [filterModalVisible, {set: setFilterModalVisible, on: showFilterModal, off: hideFilterModal}] = useToggle(false);
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id) {
      postHog.screen('weatherStations', {
        center: center_id,
      });
    }
  }, [postHog, center_id]);
  useFocusEffect(recordAnalytics);

  // when the initial filter inputs change, we should honor those
  React.useEffect(() => {
    setFilterConfig(current => ({
      ...current,
      ...initialFilterConfig,
    }));
  }, [initialFilterConfig]);

  // the displayed stations need to match all filters - for instance, if a user chooses a zone *and*
  // a source type, we only show stations that match both of those at the same time
  const resolvedFilters = useMemo(
    () => (mapLayerFeatures ? filtersForConfig(mapLayerFeatures, filterConfig, initialFilterConfig, currentTime) : []),
    [mapLayerFeatures, filterConfig, initialFilterConfig, currentTime],
  );

  const displayedStations: WeatherStationListItem[] = useMemo(
    () => weatherStations.features.map(s => ({station: s})).filter(item => resolvedFilters.every(({filter}) => filter(item.station))),
    [weatherStations, resolvedFilters],
  );

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<WeatherStationListItem>) => (
      <WeatherStationCard
        center_id={center_id}
        date={currentTime}
        station={item.station}
        units={weatherStations.properties.units}
        variables={weatherStations.properties.variables}
        mode={'list'}
      />
    ),
    [center_id, currentTime, weatherStations.properties.units, weatherStations.properties.variables],
  );

  const applyFilterRemoval = useCallback(
    (removeFilter: (config: WeatherStationFilterConfig) => WeatherStationFilterConfig) => {
      return () => setFilterConfig(removeFilter(filterConfig));
    },
    [filterConfig, setFilterConfig],
  );

  return (
    <>
      <VStack width="100%" height="100%" space={0}>
        <Modal visible={filterModalVisible} onRequestClose={hideFilterModal}>
          <WeatherStationFilterForm
            mapLayerFeatures={mapLayerFeatures}
            initialFilterConfig={{...initialFilterConfig}}
            currentFilterConfig={filterConfig}
            setFilterConfig={setFilterConfig}
            setVisible={setFilterModalVisible}
          />
        </Modal>
        <HStack space={8} pt={4} pb={16} pl={16} justifyContent="space-between" width="100%">
          <FilterPillButton
            label="Filters"
            textColor={colorLookup('text')}
            backgroundColor={colorLookup('white')}
            onPress={showFilterModal}
            headIcon={<FontAwesome name="sliders" size={16} color={colorLookup('text')} style={{marginRight: 2}} />}
          />
          <Divider direction="vertical" />
          <ScrollView horizontal style={{width: '100%'}} showsHorizontalScrollIndicator={false}>
            <HStack space={8} py={4} pr={16}>
              {resolvedFilters.map(({label, removeFilter}) => {
                const canBeDeleted = removeFilter !== undefined;
                const textColor = canBeDeleted ? colorLookup('blue2') : colorLookup('text');
                const backgroundColor = canBeDeleted ? colorLookup('color-tag') : colorLookup('white');
                const tailIcon = canBeDeleted ? (
                  <MaterialCommunityIcons name="close" size={16} style={{marginTop: 2, marginHorizontal: 0}} color={colorLookup('blue2')} />
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
        <FlatList
          ListEmptyComponent={<NotFound inline terminal what={[new NotFoundError('no weather stations found', 'any matching weather stations')]} />}
          style={{backgroundColor: colorLookup('primary.background'), width: '100%', height: '100%'}}
          data={displayedStations}
          renderItem={renderItem}
        />
      </VStack>
      <TouchableOpacity onPress={toggleMap}>
        <HStack style={{position: 'absolute', width: '100%', bottom: 24}} px={8}>
          <View flex={1} />
          <View px={8} py={4} bg={'primary'} borderRadius={30}>
            <MaterialCommunityIcons name="map-outline" size={24} color={colorLookup('primary.background').toString()} />
          </View>
        </HStack>
      </TouchableOpacity>
    </>
  );
};
