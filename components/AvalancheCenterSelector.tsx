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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackNavigatorProps, RootStackParamList} from 'routes';
import {AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const AvalancheCenterSelector: React.FunctionComponent<{
  currentCenterId: AvalancheCenterID;
  setAvalancheCenter: (center: AvalancheCenterID) => void;
}> = ({currentCenterId, setAvalancheCenter}) => {
  const navigation = useNavigation<RootStackNavigatorProps>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'avalancheCenterSelector'>['route']>();
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;
  const whichCenters = route.params.debugMode ? AvalancheCenters.AllCenters : AvalancheCenters.SupportedCenters;
  const metadataResults = useAllAvalancheCenterMetadata(capabilities, whichCenters);
  const setAvalancheCenterWrapper = React.useCallback(
    (center: AvalancheCenterID) => {
      setAvalancheCenter(center);

      navigation.goBack();
    },
    [setAvalancheCenter, navigation],
  );
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    postHog?.screen('centerSelector');
  }, [postHog]);
  useFocusEffect(recordAnalytics);

  const insets = useSafeAreaInsets();

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
        paddingBottom={insets.bottom}
      />
    </ScrollView>
  );
};
