import React, {useCallback, useMemo} from 'react';
import {Linking} from 'react-native';

import {AlertModal, AlertModalAction} from 'components/content/AlertModal';
import {Body} from 'components/text';
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

  const primaryAction = useMemo<AlertModalAction>(() => ({label: 'Go to Website', onPress: onPressWebsite}), [onPressWebsite]);

  return (
    <AlertModal isVisible={visible} onDismiss={onClose} title="Forecast Available on Official Site" showCloseButton primaryAction={primaryAction}>
      <Body>{"This avalanche center isn't available within Avy right now. You can still access their latest forecast and updates on their website."}</Body>
    </AlertModal>
  );
};
