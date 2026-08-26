import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import React, {useCallback, useMemo} from 'react';
import {Alert, ColorValue, StyleSheet, TouchableOpacity} from 'react-native';

import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {AlertModal, AlertModalActions} from 'components/content/AlertModal';
import {Button} from 'components/content/Button';
import {Divider, HStack, View} from 'components/core';
import {Body, bodySize, BodySm} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {colorLookup} from 'theme';
import {AvalancheCenterWebsites} from 'types/nationalAvalancheCenter';

const TITLE = 'Two forecasts cover Crested Butte';
const BODY = "CBAC issues the local forecast shown in this app. CAIC's statewide forecast covers this area too. Both are official and we encourage you to read both.";
const FOOTER = "Opens in your browser. This app shows CBAC's forecast only.";

const LOGO_SIZE = 44;

const logoStyle = {height: LOGO_SIZE, width: LOGO_SIZE, resizeMode: 'contain'} as const;

interface CBACForecastModalBaseProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const CBACForecastModalBase: React.FC<CBACForecastModalBaseProps> = ({visible, onClose, children}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const onPressCAICSite = useCallback(() => {
    WebBrowser.openBrowserAsync(AvalancheCenterWebsites['CAIC']).catch((e: unknown) => {
      logger.error({error: e}, 'Failed to open CAIC website');
      Alert.alert('Unable to Open Web Browser', 'An error occured when trying to open the web browser. Please try again.', [{text: 'Okay', style: 'default'}]);
    });
    onClose();
  }, [logger, onClose]);

  const header = useMemo(
    () => (
      <View pb={12}>
        <HStack space={12} alignItems="center" justifyContent="center">
          <AvalancheCenterLogo avalancheCenterId="CAIC" style={logoStyle} />
          <Divider direction="vertical" style={styles.divider} />
          <AvalancheCenterLogo avalancheCenterId="CBAC" style={logoStyle} />
        </HStack>
        <TouchableOpacity style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close-outline" size={24} color={colorLookup('text')} />
        </TouchableOpacity>
      </View>
    ),
    [onClose],
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
      <BodySm textAlign="center" color={colorLookup('text.secondary')}>
        {FOOTER}
      </BodySm>
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
