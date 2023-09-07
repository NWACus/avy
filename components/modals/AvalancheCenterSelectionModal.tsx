import React, {useCallback, useState} from 'react';

import Topo from 'assets/illustrations/topo.svg';
import {avalancheCenterList, AvalancheCenters} from 'components/avalancheCenterList';
import {AvalancheCenterList} from 'components/content/AvalancheCenterList';
import {Button} from 'components/content/Button';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {Center, View, VStack} from 'components/core';
import {Body, BodyBlack, Title3Semibold} from 'components/text';
import {useAllAvalancheCenterMetadata} from 'hooks/useAllAvalancheCenterMetadata';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {Modal} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterSelectionModalProps {
  visible: boolean;
  initialSelection: AvalancheCenterID;
  onClose: (center: AvalancheCenterID) => void;
}

export const AvalancheCenterSelectionModal: React.FC<AvalancheCenterSelectionModalProps> = ({visible, initialSelection, onClose}) => {
  const [selectedCenter, setSelectedCenter] = useState(initialSelection);
  const closeHandler = useCallback(() => {
    onClose(selectedCenter);
  }, [onClose, selectedCenter]);
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;
  const metadataResults = useAllAvalancheCenterMetadata(capabilities);
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
    <Modal transparent visible={visible} animationType="slide" onRequestClose={closeHandler}>
      <SafeAreaProvider>
        <SafeAreaView style={{backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
          <Center width="100%" height="100%" px={48}>
            <VStack alignItems="stretch" bg="white" borderRadius={16} px={12} py={24} space={8} width="100%" position="relative" overflow="hidden">
              <Center mb={4}>
                <Title3Semibold>Welcome! Let’s Get Started</Title3Semibold>
              </Center>
              <Body>Select your local avalanche center to start using the app. You can change this anytime in settings.</Body>
              <AvalancheCenterList selectedCenter={selectedCenter} setSelectedCenter={setSelectedCenter} data={avalancheCenterList(AvalancheCenters.SupportedCenters, metadata)} />
              <Button onPress={closeHandler} alignSelf="stretch" buttonStyle="primary" mt={16}>
                <BodyBlack>Continue</BodyBlack>
              </Button>
              {/* placeholder view to create space for the topo illustration */}
              <View height={200} />
              {/* these magic numbers are yanked out of Figma */}
              <Topo width={887.0152587890625} height={456.3430480957031} style={{position: 'absolute', left: -364, top: 382}} />
            </VStack>
          </Center>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};
