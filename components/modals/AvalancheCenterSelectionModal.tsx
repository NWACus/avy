import React, {useCallback, useState} from 'react';
import {StyleSheet} from 'react-native';

import Topo from 'assets/illustrations/topo.svg';
import {avalancheCenterList, AvalancheCenters} from 'components/avalancheCenterList';
import {AvalancheCenterList} from 'components/content/AvalancheCenterList';
import {Button} from 'components/content/Button';
import {incompleteQueryState} from 'components/content/QueryState';
import {Center, View, VStack} from 'components/core';
import {Body, BodyBlack, Title3Black} from 'components/text';
import {useAllAvalancheCenterMetadata} from 'hooks/useAllAvalancheCenterMetadata';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {Modal} from 'react-native';
import {SafeAreaProvider, SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterSelectionModalProps {
  visible: boolean;
  initialSelection: AvalancheCenterID;
  onClose: (center: AvalancheCenterID) => void;
}

export const AvalancheCenterSelectionModal: React.FC<AvalancheCenterSelectionModalProps> = ({visible, onClose}) => {
  const [selectedCenter, setSelectedCenter] = useState<AvalancheCenterID | undefined>();
  const closeHandler = useCallback(() => {
    if (selectedCenter) {
      onClose(selectedCenter);
    }
  }, [onClose, selectedCenter]);
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;
  const metadataResults = useAllAvalancheCenterMetadata(capabilities);
  const loading = incompleteQueryState(capabilitiesResult, ...metadataResults) || !capabilities;
  const metadata: AvalancheCenter[] = [];
  for (const result of metadataResults) {
    if (result.data) {
      metadata.push(result.data);
    }
  }
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible && !loading} animationType="slide" onRequestClose={closeHandler}>
      <SafeAreaProvider>
        <View style={{...StyleSheet.absoluteFillObject, backgroundColor: colorLookup('primary.background')}}>
          <SafeAreaView style={{width: '100%', height: '100%'}}>
            {/* view to paint the very bottom of the screen white  */}
            <View style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: safeAreaInsets.bottom, backgroundColor: 'white'}} />
            {/* overflow hidden to keep the topo illustration from going beyond this view */}
            <VStack justifyContent="space-between" height="100%" overflow="hidden">
              {/* these magic numbers are yanked out of Figma */}
              <Topo width={887.0152587890625} height={456.3430480957031} style={{position: 'absolute', left: -264, top: 402}} />
              <VStack space={16} pt={96} px={16}>
                <Center px={32}>
                  <Title3Black textAlign="center" color={colorLookup('NWAC-dark')}>
                    Welcome! Get started by selecting your local avalanche center.
                  </Title3Black>
                </Center>
                <Center px={32} pb={32}>
                  <Body textAlign="center">You can change this anytime in settings.</Body>
                </Center>
                <AvalancheCenterList
                  selectedCenter={selectedCenter}
                  setSelectedCenter={setSelectedCenter}
                  data={avalancheCenterList(AvalancheCenters.SupportedCenters, metadata)}
                />
              </VStack>
              <Center height={100} width="100%" px={16} backgroundColor={'white'}>
                <Button disabled={!selectedCenter} onPress={closeHandler} alignSelf="stretch" buttonStyle="primary" mt={16}>
                  <BodyBlack>Continue</BodyBlack>
                </Button>
              </Center>
            </VStack>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
};
