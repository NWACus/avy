import React, {useCallback, useMemo, useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';

import {AlertModal, AlertModalActions} from 'components/content/AlertModal';
import {Button} from 'components/content/Button';
import {TOGGLE_ROW_MIN_HEIGHT, ToggleRow} from 'components/content/ToggleRow';
import {VStack} from 'components/core';
import {PushNotificationsPermissionsHeader} from 'components/modals/push-notifications/PushNotificationsPermissionsModal';
import {Body, BodySemibold} from 'components/text';
import {NotificationZone} from 'types/notifications';

const TITLE = "You're all set";

const MAX_VISIBLE_ZONES = 4;
const ZONE_ROW_SPACING = 8;
const ZONE_LIST_PEEK_HEIGHT = (MAX_VISIBLE_ZONES - 1) * (TOGGLE_ROW_MIN_HEIGHT + ZONE_ROW_SPACING) + TOGGLE_ROW_MIN_HEIGHT / 2;

interface PushNotificationsPermissionsAcceptedModalProps {
  visible: boolean;
  centerName: string;
  zones: NotificationZone[];
  onClose: () => void;
  onContinue: (enabledZoneIds: Set<number>) => void;
  onManageNotifications: () => void;
}

export const PushNotificationsPermissionsAcceptedModal: React.FC<PushNotificationsPermissionsAcceptedModalProps> = ({
  visible,
  centerName,
  zones,
  onClose,
  onContinue,
  onManageNotifications,
}) => {
  const [enabledZoneIds, setEnabledZoneIds] = useState<Set<number>>(() => new Set(zones.map(zone => zone.id)));

  const onToggleZone = useCallback((zoneId: number, enabled: boolean) => {
    setEnabledZoneIds(current => {
      const next = new Set(current);
      if (enabled) {
        next.add(zoneId);
      } else {
        next.delete(zoneId);
      }
      return next;
    });
  }, []);

  const zoneToggleHandlers = useMemo(
    () => Object.fromEntries(zones.map(zone => [zone.id, (value: boolean) => onToggleZone(zone.id, value)])) as Record<number, (value: boolean) => void>,
    [zones, onToggleZone],
  );

  const onPressContinue = useCallback(() => onContinue(enabledZoneIds), [onContinue, enabledZoneIds]);

  const header = useMemo(() => <PushNotificationsPermissionsHeader onClose={onClose} />, [onClose]);

  return (
    <AlertModal isVisible={visible} onDismiss={onClose} title={TITLE} titleAlign="center" header={header}>
      <Body>{`Turn on specific ${centerName} notifications.`}</Body>
      <ScrollView style={zones.length > MAX_VISIBLE_ZONES ? styles.zoneListOverflow : styles.zoneList} bounces={false}>
        <VStack space={ZONE_ROW_SPACING}>
          {zones.map(zone => (
            <ToggleRow key={zone.id} title={zone.name} value={enabledZoneIds.has(zone.id)} onValueChange={zoneToggleHandlers[zone.id]} />
          ))}
        </VStack>
      </ScrollView>
      <AlertModalActions>
        <Button buttonStyle="primary" onPress={onPressContinue}>
          <BodySemibold>Continue to map</BodySemibold>
        </Button>
        <Button buttonStyle="secondary" onPress={onManageNotifications}>
          <BodySemibold>Manage Notifications</BodySemibold>
        </Button>
      </AlertModalActions>
    </AlertModal>
  );
};

const styles = StyleSheet.create({
  zoneList: {
    flexGrow: 0,
  },
  zoneListOverflow: {
    flexGrow: 0,
    maxHeight: ZONE_LIST_PEEK_HEIGHT,
  },
});
