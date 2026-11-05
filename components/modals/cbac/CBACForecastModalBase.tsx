import Ionicons from '@expo/vector-icons/Ionicons';
import React, {useCallback, useEffect, useMemo} from 'react';
import {ColorValue, StyleSheet, TouchableOpacity} from 'react-native';

import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {AlertModal, AlertModalActions} from 'components/content/AlertModal';
import {Button} from 'components/content/Button';
import {Divider, HStack, View} from 'components/core';
import {Body, bodySize} from 'components/text';
import {CBACAnalyticsSource, useAnalytics} from 'hooks/useAnalytics';
import {useOpenAvalancheCenterWebsite} from 'hooks/useOpenAvalancheCenterWebsite';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

const TITLE = 'Two forecasts cover this area';
const BODY = 'CBAC issues a localized forecast. CAIC forecasts for the entire state. We encourage you to read both.';

const LOGO_SIZE = 44;

const logoStyle = {height: LOGO_SIZE, width: LOGO_SIZE, resizeMode: 'contain'} as const;

interface CBACForecastModalBaseProps {
  visible: boolean;
  centerId: AvalancheCenterID;
  source: CBACAnalyticsSource;
  onClose: () => void;
  children: React.ReactNode;
}

export const CBACForecastModalBase: React.FC<CBACForecastModalBaseProps> = ({visible, centerId, source, onClose, children}) => {
  const analytics = useAnalytics();
  const openAvalancheCenterWebsite = useOpenAvalancheCenterWebsite();

  useEffect(() => {
    if (visible) {
      analytics.capture('cbac_modal_shown', {center: centerId, displayed_from: source});
    }
  }, [analytics, visible, centerId, source]);

  const onPressClose = useCallback(() => {
    analytics.capture('cbac_modal_close_tapped', {center: centerId, displayed_from: source});
    onClose();
  }, [analytics, centerId, source, onClose]);

  const onPressCAICSite = useCallback(() => {
    analytics.capture('open_caic_site_tapped', {center: centerId, displayed_from: source});
    openAvalancheCenterWebsite('CAIC', onClose);
  }, [analytics, centerId, source, openAvalancheCenterWebsite, onClose]);

  const header = useMemo(
    () => (
      <View pb={12}>
        <HStack space={12} alignItems="center" justifyContent="center">
          <AvalancheCenterLogo avalancheCenterId="CAIC" style={logoStyle} />
          <Divider direction="vertical" style={styles.divider} />
          <AvalancheCenterLogo avalancheCenterId="CBAC" style={logoStyle} />
        </HStack>
        <TouchableOpacity style={styles.close} onPress={onPressClose} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close-outline" size={24} color={colorLookup('text')} />
        </TouchableOpacity>
      </View>
    ),
    [onPressClose],
  );

  const renderVisitCAICButton = useCallback(
    ({textColor}: {backgroundColor: ColorValue | undefined; textColor: ColorValue}) => (
      <HStack space={8} alignItems="center" justifyContent="center">
        <Body color={textColor}>Open CAIC Site</Body>
        <Ionicons name="open-outline" size={bodySize + 4} color={textColor} />
      </HStack>
    ),
    [],
  );

  return (
    <AlertModal isVisible={visible} onDismiss={onClose} title={TITLE} titleAlign="center" header={header}>
      <Body>{BODY}</Body>
      <AlertModalActions>
        {children}
        <Button buttonStyle="secondary" onPress={onPressCAICSite} renderChildren={renderVisitCAICButton} />
      </AlertModalActions>
    </AlertModal>
  );
};

const styles = StyleSheet.create({
  divider: {
    height: LOGO_SIZE * 0.6,
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
