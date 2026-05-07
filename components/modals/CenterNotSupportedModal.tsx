import Ionicons from '@expo/vector-icons/Ionicons';
import React, {useCallback} from 'react';
import {Alert, Modal, TouchableOpacity} from 'react-native';

import {Button} from 'components/content/Button';
import {HStack, View, VStack} from 'components/core';
import {Body, BodyBlack, Title3Black} from 'components/text';
import * as WebBrowser from 'expo-web-browser';
import {useAnalytics} from 'hooks/useAnalytics';
import {logger} from 'logger';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface CenterNotSupportedModalProps {
  visible: boolean;
  centerId: AvalancheCenterID;
  unsupportedCenterId: AvalancheCenterID | 'CAN' | null;
  avalancheCenterWebsiteUrl: string | null;
  onClose: () => void;
}

export const CenterNotSupportedModal: React.FC<CenterNotSupportedModalProps> = ({visible, centerId, unsupportedCenterId, avalancheCenterWebsiteUrl, onClose}) => {
  const analytics = useAnalytics();

  const onPressWebsite = useCallback(() => {
    if (!unsupportedCenterId || !avalancheCenterWebsiteUrl) {
      logger.warn({unsupported_center_id: unsupportedCenterId}, 'Center URL was unexpectedly empty');
      onClose();
      return;
    }
    analytics.capture('unsupported_center_website_tapped', {center: centerId, unsupported_center_id: unsupportedCenterId, url: avalancheCenterWebsiteUrl});
    WebBrowser.openBrowserAsync(avalancheCenterWebsiteUrl)
      .then(onClose)
      .catch((e: unknown) => {
        logger.error({error: e}, 'Failed to open unsupported center URL');
        Alert.alert('Unable to Open Web Browser', 'An error occured when trying to open the web browser. Please try again.', [
          {
            text: 'Okay',
            style: 'default',
          },
        ]);
      });
  }, [analytics, centerId, unsupportedCenterId, avalancheCenterWebsiteUrl, onClose]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24}}>
        <VStack style={{backgroundColor: colorLookup('white'), borderRadius: 16, padding: 24, width: '100%', maxWidth: 340}}>
          <VStack space={12}>
            <HStack width={'100%'} paddingHorizontal={8} alignItems={'flex-start'} space={8}>
              <View flex={1}>
                <Title3Black>Forecast Available on Official Site</Title3Black>
              </View>
              <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close-outline" size={24} color={colorLookup('text')} />
              </TouchableOpacity>
            </HStack>
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
