import React, {useCallback} from 'react';

import {AlertModal, AlertModalActions} from 'components/content/AlertModal';
import {Button} from 'components/content/Button';
import {Body, BodyBlack} from 'components/text';
import {useOpenAvalancheCenterWebsite} from 'hooks/useOpenAvalancheCenterWebsite';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface CenterNotSupportedModalProps {
  visible: boolean;
  centerId: AvalancheCenterID | null;
  onClose: () => void;
}

export const CenterNotSupportedModal: React.FC<CenterNotSupportedModalProps> = ({visible, centerId, onClose}) => {
  const openAvalancheCenterWebsite = useOpenAvalancheCenterWebsite();

  const onPressWebsite = useCallback(() => {
    if (centerId) {
      openAvalancheCenterWebsite(centerId, onClose);
    } else {
      onClose();
    }
  }, [centerId, openAvalancheCenterWebsite, onClose]);

  return (
    <AlertModal isVisible={visible} onDismiss={onClose} title="Forecast Available on Official Site" showCloseButton>
      <Body>{"This avalanche center isn't available within Avy right now. You can still access their latest forecast and updates on their website."}</Body>
      <AlertModalActions>
        <Button buttonStyle="primary" onPress={onPressWebsite}>
          <BodyBlack>Go to Website</BodyBlack>
        </Button>
      </AlertModalActions>
    </AlertModal>
  );
};
