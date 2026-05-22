import Ionicons from '@expo/vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, View} from 'components/core';
import {ObservationCard} from 'components/observations/ObservationDetailView';
import {matchesZone} from 'components/observations/ObservationsFilterForm';
import {Title3Black} from 'components/text';
import {useAllMapLayers} from 'hooks/useAllMapLayers';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useNACObservation} from 'hooks/useNACObservation';
import React, {useCallback, useMemo} from 'react';
import {MainStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, mapFeaturesForCenter} from 'types/nationalAvalancheCenter';

export const ObservationDetailModalView: React.FunctionComponent<{
  id: string;
}> = ({id}) => {
  const observationResult = useNACObservation(id);
  const observation = observationResult.data;
  const mapResult = useAllMapLayers();
  const mapLayer = mapResult.data;
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;

  const mapFeatures = useMemo(() => mapFeaturesForCenter(mapLayer, observation?.center_id.toUpperCase() as AvalancheCenterID), [mapLayer, observation?.center_id]);
  const navigation = useNavigation<MainStackNavigationProps>();
  const zone_name = useMemo(
    () => observation?.location_point?.lat && observation?.location_point?.lng && matchesZone(mapFeatures ?? [], observation.location_point?.lat, observation.location_point?.lng),
    [observation, mapFeatures],
  );

  const closeModal = useCallback(() => navigation.goBack(), [navigation]);

  if (incompleteQueryState(observationResult, mapResult, capabilitiesResult) || !observation || !mapLayer || !capabilities) {
    return <QueryState results={[observationResult, mapResult, capabilitiesResult]} />;
  }

  return (
    <View flex={1}>
      <ObsDetailModalHeader title={zone_name ? `${zone_name} Observation` : 'Observation'} centerId={observation.center_id} onClosePressed={closeModal} />
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
