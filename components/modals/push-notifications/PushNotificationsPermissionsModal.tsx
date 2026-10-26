import Ionicons from '@expo/vector-icons/Ionicons';
import React, {useCallback, useMemo} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';

import {AlertModal, AlertModalActions} from 'components/content/AlertModal';
import {Button} from 'components/content/Button';
import {View} from 'components/core';
import {Body, BodySemibold} from 'components/text';
import {colorLookup} from 'theme';

const TITLE = 'Get Notified';
const BODY = 'Get notified about avalanche warnings.';

interface PushNotificationsPermissionsModalProps {
  visible: boolean;
  onClose: () => void;
  onTurnOnNotifications: () => void;
}

export const PushNotificationsPermissionsModal: React.FC<PushNotificationsPermissionsModalProps> = ({visible, onClose, onTurnOnNotifications}) => {
  const header = useMemo(() => <PushNotificationsPermissionsHeader onClose={onClose} />, [onClose]);

  return (
    <AlertModal isVisible={visible} onDismiss={onClose} title={TITLE} titleAlign="center" header={header}>
      <Body textAlign="center">{BODY}</Body>
      <AlertModalActions>
        <Button buttonStyle="primary" onPress={onTurnOnNotifications}>
          <BodySemibold>Turn on notifications</BodySemibold>
        </Button>
        <TouchableOpacity style={styles.notNow} onPress={onClose} accessibilityRole="button">
          <Body>Not now</Body>
        </TouchableOpacity>
      </AlertModalActions>
    </AlertModal>
  );
};

interface PushNotificationsPermissionsHeaderProps {
  onClose: () => void;
}

export const PushNotificationsPermissionsHeader: React.FC<PushNotificationsPermissionsHeaderProps> = ({onClose}) => {
  const onCloseTapped = useCallback(() => onClose(), [onClose]);

  return (
    <View alignItems="center" pb={12}>
      <Ionicons name="notifications-outline" size={32} color={colorLookup('text')} />
      <TouchableOpacity style={styles.close} onPress={onCloseTapped} accessibilityRole="button" accessibilityLabel="Close">
        <Ionicons name="close-outline" size={24} color={colorLookup('text')} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  notNow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
