import React, {useCallback} from 'react';

import {Button} from 'components/content/Button';
import {CBACForecastModalBase} from 'components/modals/cbac/CBACForecastModalBase';
import {Body, BodyBlack} from 'components/text';
import {CBACAnalyticsSource, useAnalytics} from 'hooks/useAnalytics';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface CBACForecastCenterlessModalProps {
  visible: boolean;
  centerId: AvalancheCenterID;
  onClose: () => void;
  onSwitchToCBAC: () => void;
}

export const CBACForecastCenterlessModal: React.FC<CBACForecastCenterlessModalProps> = ({visible, centerId, onClose, onSwitchToCBAC}) => {
  const analytics = useAnalytics();

  const onPressContinueExploring = useCallback(() => {
    analytics.capture('continue_exploring_tapped', {center: centerId, displayed_from: CBACAnalyticsSource.CenterlessModal});
    onClose();
  }, [analytics, centerId, onClose]);

  const onPressOpenCBAC = useCallback(() => {
    analytics.capture('open_cbac_tapped', {center: centerId, displayed_from: CBACAnalyticsSource.CenterlessModal});
    onSwitchToCBAC();
  }, [analytics, centerId, onSwitchToCBAC]);

  return (
    <CBACForecastModalBase visible={visible} centerId={centerId} source={CBACAnalyticsSource.CenterlessModal} onClose={onClose}>
      <Button buttonStyle="primary" onPress={onPressContinueExploring}>
        <BodyBlack>Continue exploring</BodyBlack>
      </Button>
      <Button buttonStyle="secondary" onPress={onPressOpenCBAC}>
        <Body>Open CBAC</Body>
      </Button>
    </CBACForecastModalBase>
  );
};
