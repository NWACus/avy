import React, {useCallback} from 'react';

import {Button} from 'components/content/Button';
import {CBACForecastModalBase} from 'components/modals/cbac/CBACForecastModalBase';
import {BodyBlack} from 'components/text';
import {CBACAnalyticsSource, useAnalytics} from 'hooks/useAnalytics';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface CBACForecastFirstRunModalProps {
  visible: boolean;
  centerId: AvalancheCenterID;
  onClose: () => void;
}

export const CBACForecastFirstRunModal: React.FC<CBACForecastFirstRunModalProps> = ({visible, centerId, onClose}) => {
  const analytics = useAnalytics();

  const onPressGotIt = useCallback(() => {
    analytics.capture('cbac_got_it_tapped', {center: centerId, displayed_from: CBACAnalyticsSource.FirstRunModal});
    onClose();
  }, [analytics, centerId, onClose]);

  return (
    <CBACForecastModalBase visible={visible} centerId={centerId} source={CBACAnalyticsSource.FirstRunModal} onClose={onClose}>
      <Button buttonStyle="primary" onPress={onPressGotIt}>
        <BodyBlack>Got it</BodyBlack>
      </Button>
    </CBACForecastModalBase>
  );
};
