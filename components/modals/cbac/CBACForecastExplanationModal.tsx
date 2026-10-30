import React, {useCallback} from 'react';

import {Button} from 'components/content/Button';
import {CBACForecastModalBase} from 'components/modals/cbac/CBACForecastModalBase';
import {Body, BodyBlack} from 'components/text';
import {CBACAnalyticsSource, useAnalytics} from 'hooks/useAnalytics';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface CBACForecastExplanationModalProps {
  visible: boolean;
  centerId: AvalancheCenterID;
  onClose: () => void;
  onExploreBoth: () => void;
}

export const CBACForecastExplanationModal: React.FC<CBACForecastExplanationModalProps> = ({visible, centerId, onClose, onExploreBoth}) => {
  const analytics = useAnalytics();

  const onPressExploreBoth = useCallback(() => {
    analytics.capture('explore_both_forecasts_tapped', {center: centerId, displayed_from: CBACAnalyticsSource.ExplanationModal});
    onExploreBoth();
  }, [analytics, centerId, onExploreBoth]);

  const onPressStayOnCBAC = useCallback(() => {
    analytics.capture('stay_on_cbac_tapped', {center: centerId, displayed_from: CBACAnalyticsSource.ExplanationModal});
    onClose();
  }, [analytics, centerId, onClose]);

  return (
    <CBACForecastModalBase visible={visible} centerId={centerId} source={CBACAnalyticsSource.ExplanationModal} onClose={onClose}>
      <Button buttonStyle="primary" onPress={onPressExploreBoth}>
        <BodyBlack>Explore both forecasts</BodyBlack>
      </Button>
      <Button buttonStyle="secondary" onPress={onPressStayOnCBAC}>
        <Body>Stay on CBAC</Body>
      </Button>
    </CBACForecastModalBase>
  );
};
