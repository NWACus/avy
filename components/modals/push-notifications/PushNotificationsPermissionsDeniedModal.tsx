import React, {useCallback, useMemo} from 'react';

import {AlertModal, AlertModalActions} from 'components/content/AlertModal';
import {Button} from 'components/content/Button';
import {PushNotificationsPermissionsHeader} from 'components/modals/push-notifications/PushNotificationsPermissionsModal';
import {Body, BodySemibold} from 'components/text';
import * as Linking from 'expo-linking';
import {logger} from 'logger';

const TITLE = 'Notifications are turned off';
const BODY = `You chose not to allow notifications, so we can't send critical alerts. You can turn them on in your phone's Settings at any time`;

interface PushNotificationsPermissionsDeniedModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PushNotificationsPermissionsDeniedModal: React.FC<PushNotificationsPermissionsDeniedModalProps> = ({visible, onClose}) => {
  const header = useMemo(() => <PushNotificationsPermissionsHeader onClose={onClose} />, [onClose]);

  const continueToMapPresed = useCallback(() => {
    onClose();
  }, [onClose]);

  const openSettingsPressed = useCallback(() => {
    Linking.openSettings().catch(err => logger.error('An error occurred while trying to open the Settings', err));
  }, []);

  return (
    <AlertModal isVisible={visible} onDismiss={onClose} title={TITLE} titleAlign="center" header={header}>
      <Body textAlign="center">{BODY}</Body>
      <AlertModalActions>
        <Button buttonStyle="primary" onPress={openSettingsPressed}>
          <BodySemibold>Open Settings</BodySemibold>
        </Button>
        <Button buttonStyle="secondary" onPress={continueToMapPresed}>
          <BodySemibold>Continue to map</BodySemibold>
        </Button>
      </AlertModalActions>
    </AlertModal>
  );
};
