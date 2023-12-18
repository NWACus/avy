import {AntDesign} from '@expo/vector-icons';
import {Button} from 'components/content/Button';
import {Center, View, VStack} from 'components/core';
import {BodyBlack} from 'components/text';
import {useToggle} from 'hooks/useToggle';
import React, {useCallback} from 'react';
import {Image, Modal, TouchableOpacity, TouchableWithoutFeedback} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';

export interface CampaignModalProps {
  onAction?: () => void;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({onAction = () => undefined}) => {
  const [showModal, {off: hideModal}] = useToggle(true);
  const activateCampaign = useCallback(() => {
    hideModal();
    onAction();
  }, [hideModal, onAction]);

  return (
    // Pressing the Android back button dismisses the modal
    <Modal visible={showModal} transparent animationType="fade" onRequestClose={hideModal}>
      {/* Pressing anywhere outside the modal dismisses the modal */}
      <TouchableWithoutFeedback onPress={hideModal}>
        <View position="absolute" top={0} bottom={0} left={0} right={0} backgroundColor={'rgba(0, 0, 0, 0.55)'} padding={32}>
          <SafeAreaView>
            <Center width="100%" height="100%">
              <VStack
                alignItems="center"
                justifyContent="center"
                alignContent="center"
                width="100%"
                backgroundColor={colorLookup('NWAC-dark')}
                borderRadius={16}
                pt={80}
                pb={16}
                space={24}
                style={{
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,

                  elevation: 5,
                }}>
                <TouchableOpacity onPress={hideModal} style={{position: 'absolute', right: 16, top: 16}}>
                  <AntDesign name="close" size={24} color="white" />
                </TouchableOpacity>
                <View style={{position: 'relative', height: 160, width: '100%'}}>
                  <Image
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    source={require('assets/campaigns/campaign-q4-2023/banner.png')}
                    style={{height: undefined, width: undefined, aspectRatio: 2.74348422}}
                    resizeMode="contain"
                  />
                </View>
                <Center width="100%" px={16} alignItems="stretch">
                  <Button buttonStyle="primary" onPress={activateCampaign}>
                    <BodyBlack>Donate Today</BodyBlack>
                  </Button>
                </Center>
              </VStack>
            </Center>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
