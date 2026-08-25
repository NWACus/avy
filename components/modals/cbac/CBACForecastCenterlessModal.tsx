import React from 'react';

import {Button} from 'components/content/Button';
import {CBACForecastModalBase} from 'components/modals/cbac/CBACForecastModalBase';
import {Body, BodyBlack} from 'components/text';

interface CBACForecastCenterlessModalProps {
  visible: boolean;
  onClose: () => void;
  onSwitchToCBAC: () => void;
}

export const CBACForecastCenterlessModal: React.FC<CBACForecastCenterlessModalProps> = ({visible, onClose, onSwitchToCBAC}) => (
  <CBACForecastModalBase visible={visible} onClose={onClose}>
    <Button buttonStyle="primary" onPress={onClose}>
      <BodyBlack>Continue exploring</BodyBlack>
    </Button>
    <Button buttonStyle="secondary" onPress={onSwitchToCBAC}>
      <Body>Switch to CBAC</Body>
    </Button>
  </CBACForecastModalBase>
);
