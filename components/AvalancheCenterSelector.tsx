import React, {useCallback} from 'react';

import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {ScrollView} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {avalancheCenterList, AvalancheCenters} from 'components/avalancheCenterList';
import {AvalancheCenterList} from 'components/content/AvalancheCenterList';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {useAllAvalancheCenterMetadata} from 'hooks/useAllAvalancheCenterMetadata';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {usePostHog} from 'posthog-react-native';
import {MenuStackParamList, TabNavigationProps} from 'routes';
import {AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const AvalancheCenterSelector: React.FunctionComponent<{
  currentCenterId: AvalancheCenterID;
  setAvalancheCenter: (center: AvalancheCenterID) => void;
}> = ({currentCenterId, setAvalancheCenter}) => {
  const navigation = useNavigation<TabNavigationProps>();
  const route = useRoute<NativeStackScreenProps<MenuStackParamList, 'avalancheCenterSelector'>['route']>();
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;
  const whichCenters = route.params.debugMode ? AvalancheCenters.AllCenters : AvalancheCenters.SupportedCenters;
  const metadataResults = useAllAvalancheCenterMetadata(capabilities, whichCenters);
  const setAvalancheCenterWrapper = React.useCallback(
    (center: AvalancheCenterID) => {
      setAvalancheCenter(center);
      // We need to clear navigation state to force all screens from the
      // previous avalanche center selection to unmount
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    },
    [setAvalancheCenter, navigation],
  );
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    postHog?.screen('centerSelector');
  }, [postHog]);
  useFocusEffect(recordAnalytics);

  if (incompleteQueryState(capabilitiesResult, ...metadataResults) || !capabilities) {
    return <QueryState results={[capabilitiesResult, ...metadataResults]} />;
  }

  const metadata: AvalancheCenter[] = [];
  for (const result of metadataResults) {
    if (result.data) {
      metadata.push(result.data);
    }
  }

  return (
    <ScrollView style={{height: '100%', width: '100%'}}>
      <AvalancheCenterList
        selectedCenter={currentCenterId}
        setSelectedCenter={setAvalancheCenterWrapper}
        data={avalancheCenterList(metadata, capabilities)}
        width="100%"
        height="100%"
        bg="white"
        px={16}
        py={8}
      />
    </ScrollView>
  );
};
