import React, {useCallback} from 'react';

import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {ScrollView} from 'react-native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {avalancheCenterList, AvalancheCenters} from 'components/avalancheCenterList';
import {AvalancheCenterList} from 'components/content/AvalancheCenterList';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {useAllAvalancheCenterMetadata} from 'hooks/useAllAvalancheCenterMetadata';
import {CenterSwitchOrigin, useAnalytics} from 'hooks/useAnalytics';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MainStackNavigationProps, MainStackParamList} from 'routes';
import {AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const AvalancheCenterSelector: React.FunctionComponent<{
  currentCenterId: AvalancheCenterID;
  setAvalancheCenter: (center: AvalancheCenterID) => void;
}> = ({currentCenterId, setAvalancheCenter}) => {
  const navigation = useNavigation<MainStackNavigationProps>();
  const route = useRoute<NativeStackScreenProps<MainStackParamList, 'avalancheCenterSelector'>['route']>();
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;
  const whichCenters = route.params.debugMode ? AvalancheCenters.AllCenters : AvalancheCenters.SupportedCenters;
  const metadataResults = useAllAvalancheCenterMetadata(capabilities, whichCenters);
  const analytics = useAnalytics();

  const setAvalancheCenterWrapper = React.useCallback(
    (center: AvalancheCenterID) => {
      analytics.captureCenterSwitch(currentCenterId, center, CenterSwitchOrigin.CenterSelectorView);
      setAvalancheCenter(center);

      navigation.goBack();
    },
    [setAvalancheCenter, currentCenterId, navigation, analytics],
  );

  const recordAnalytics = useCallback(() => {
    analytics.screen('centerSelector');
  }, [analytics]);
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
    <ScrollView style={{height: '100%', width: '100%'}} directionalLockEnabled={true}>
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
