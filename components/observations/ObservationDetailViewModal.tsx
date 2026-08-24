import Ionicons from '@expo/vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, View} from 'components/core';
import {ObservationCard} from 'components/observations/ObservationDetailView';
import {matchesZone} from 'components/observations/ObservationsFilterForm';
import {Title3Black} from 'components/text';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAlternateObservationZones} from 'hooks/useAlternateObservationZones';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useNACObservation} from 'hooks/useNACObservation';
import React, {useCallback, useMemo} from 'react';
import {MainStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AllAvalancheCenterCapabilities, AvalancheCenterID, mapFeaturesForCenter, MapLayer, Observation} from 'types/nationalAvalancheCenter';

export const ObservationDetailModalView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useNACObservation(id);
  const observation = observationResult.data;
  const mapResult = useAllMapLayers('latest');
  const mapLayer = mapResult.data;
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;

  if (incompleteQueryState(observationResult, mapResult, capabilitiesResult) || !observation || !mapLayer || !capabilities) {
    return <QueryState results={[observationResult, mapResult, capabilitiesResult]} />;
  }

  return <ObservationDetailModalContent observation={observation} mapLayer={mapLayer} capabilities={capabilities} />;
};

const ObservationDetailModalContent: React.FunctionComponent<{
  observation: Observation;
  mapLayer: MapLayer;
  capabilities: AllAvalancheCenterCapabilities;
}> = ({observation, mapLayer, capabilities}) => {
  const centerId = observation.center_id;

  const avalancheZoneMetadataResult = useAvalancheCenterMetadata(centerId);
  const alternateZonesUrl: string = avalancheZoneMetadataResult.data?.widget_config?.observation_viewer?.alternate_zones || '';
  const alternateObservationZonesResult = useAlternateObservationZones(alternateZonesUrl, centerId);
  const alternateObservationZoneFeatures = alternateObservationZonesResult.data?.features;

  const mapFeatures = useMemo(() => mapFeaturesForCenter(mapLayer, centerId), [mapLayer, centerId]);
  const navigation = useNavigation<MainStackNavigationProps>();
  const zone_name = useMemo(
    () =>
      observation.location_point?.lat &&
      observation.location_point?.lng &&
      matchesZone(mapFeatures ?? [], observation.location_point.lat, observation.location_point.lng, alternateObservationZoneFeatures),
    [observation, mapFeatures, alternateObservationZoneFeatures],
  );

  const closeModal = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View flex={1}>
      <ObsDetailModalHeader title={zone_name ? `${zone_name} Observation` : 'Observation'} centerId={centerId} onClosePressed={closeModal} />
      <ObservationCard observation={observation} capabilities={capabilities} />
    </View>
  );
};

interface ObsDetailModalHeaderProps {
  title: string;
  centerId: AvalancheCenterID;
  onClosePressed: () => void;
}

const ObsDetailModalHeader: React.FunctionComponent<ObsDetailModalHeaderProps> = ({title, centerId, onClosePressed}) => {
  return (
    <View style={{width: '100%', backgroundColor: colorLookup('white'), paddingVertical: 8, justifyContent: 'center', alignContent: 'center'}}>
      <HStack justifyContent="space-between" space={8} px={16}>
        <Ionicons.Button
          size={24}
          color={colorLookup('primary')}
          name="close"
          backgroundColor={colorLookup('white')}
          iconStyle={{marginLeft: 0, marginRight: 0}}
          style={{textAlign: 'center', borderColor: 'transparent', borderWidth: 1}}
          onPress={onClosePressed}
        />

        <Title3Black textAlign="center" style={{flex: 1, borderColor: 'transparent', borderWidth: 1, color: colorLookup('text')}}>
          {title}
        </Title3Black>

        <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain', flex: 0, flexGrow: 0, marginTop: 4}} avalancheCenterId={centerId} />
      </HStack>
    </View>
  );
};
