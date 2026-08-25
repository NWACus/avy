import {AlertModal, AlertModalAction} from 'components/content/AlertModal';
import {Body} from 'components/text';
import * as WebBrowser from 'expo-web-browser';
import {useAnalytics} from 'hooks/useAnalytics';
import {logger} from 'logger';
import React, {useCallback, useMemo} from 'react';
import {Alert} from 'react-native';
import {AvalancheCenterID, UnsupportedCenterID, UnsupportedCenterNames} from 'types/nationalAvalancheCenter';

interface CenterNotSupportedModalProps {
  visible: boolean;
  centerId: AvalancheCenterID;
  unsupportedCenterId: UnsupportedCenterID | null;
  avalancheCenterWebsiteUrl: string | null;
  onClose: () => void;
}

export const CenterNotSupportedModal: React.FC<CenterNotSupportedModalProps> = ({visible, centerId, unsupportedCenterId, avalancheCenterWebsiteUrl, onClose}) => {
  const analytics = useAnalytics();
  const centerDisplayName = unsupportedCenterId ? UnsupportedCenterNames[unsupportedCenterId] : 'This avalanche center';

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

  const primaryAction = useMemo<AlertModalAction>(
    () => ({label: `Open ${unsupportedCenterId === 'CAN' ? 'Avalance Canada' : unsupportedCenterId} Site`, onPress: onPressWebsite}),
    [onPressWebsite, unsupportedCenterId],
  );

  return (
    <AlertModal isVisible={visible} onDismiss={onClose} title="Forecast Available on Official Site" showCloseButton primaryAction={primaryAction}>
      <Body>{`${centerDisplayName} isn't available within Avy right now. You can still access their latest forecast and updates on their website.`}</Body>
    </AlertModal>
  );
};
