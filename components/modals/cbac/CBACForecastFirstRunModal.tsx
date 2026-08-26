import React from 'react';

import {Button} from 'components/content/Button';
import {CBACForecastModalBase} from 'components/modals/cbac/CBACForecastModalBase';
import {BodyBlack} from 'components/text';

interface CBACForecastFirstRunModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CBACForecastFirstRunModal: React.FC<CBACForecastFirstRunModalProps> = ({visible, onClose}) => (
  <CBACForecastModalBase visible={visible} onClose={onClose}>
    <Button buttonStyle="primary" onPress={onClose}>
      <BodyBlack>Got it</BodyBlack>
    </Button>
  </CBACForecastModalBase>
);
