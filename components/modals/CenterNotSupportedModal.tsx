import Ionicons from '@expo/vector-icons/Ionicons';
import React, {useCallback} from 'react';
import {Linking, Modal, TouchableOpacity} from 'react-native';

import {Button} from 'components/content/Button';
import {HStack, View, VStack} from 'components/core';
import {Body, BodyBlack, Title3Black} from 'components/text';
import {colorLookup} from 'theme';
import {AvalancheCenterID, AvalancheCenterWebsites} from 'types/nationalAvalancheCenter';

interface CenterNotSupportedModalProps {
  visible: boolean;
  centerId: AvalancheCenterID | null;
  onClose: () => void;
}

export const CenterNotSupportedModal: React.FC<CenterNotSupportedModalProps> = ({visible, centerId, onClose}) => {
  const onPressWebsite = useCallback(() => {
    const url = centerId ? AvalancheCenterWebsites[centerId] : '';
    if (url) {
      void Linking.openURL(url);
    }
    onClose();
  }, [centerId, onClose]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24}}>
        <VStack style={{backgroundColor: colorLookup('white'), borderRadius: 16, padding: 24, width: '100%', maxWidth: 340}}>
          <HStack justifyContent="flex-end" width={'100%'} paddingBottom={8}>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close-outline" size={24} color={colorLookup('text')} />
            </TouchableOpacity>
          </HStack>

          <VStack space={12}>
            <Title3Black>Forecast Available on Official Site</Title3Black>
            <Body>{"This avalanche center isn't available within Avy right now. You can still access their latest forecast and updates on their website."}</Body>
          </VStack>
          <View mt={20}>
            <Button buttonStyle="primary" onPress={onPressWebsite}>
              <BodyBlack>Go to Website</BodyBlack>
            </Button>
          </View>
        </VStack>
      </View>
    </Modal>
  );
};
