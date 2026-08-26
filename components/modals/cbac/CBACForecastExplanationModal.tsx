import React from 'react';

import {Button} from 'components/content/Button';
import {CBACForecastModalBase} from 'components/modals/cbac/CBACForecastModalBase';
import {Body, BodyBlack} from 'components/text';

interface CBACForecastExplanationModalProps {
  visible: boolean;
  onClose: () => void;
  onExploreBoth: () => void;
}

export const CBACForecastExplanationModal: React.FC<CBACForecastExplanationModalProps> = ({visible, onClose, onExploreBoth}) => (
  <CBACForecastModalBase visible={visible} onClose={onClose}>
    <Button buttonStyle="primary" onPress={onExploreBoth}>
      <BodyBlack>Explore both forecasts</BodyBlack>
    </Button>
    <Button buttonStyle="secondary" onPress={onClose}>
      <Body>Stay on CBAC</Body>
    </Button>
  </CBACForecastModalBase>
);
