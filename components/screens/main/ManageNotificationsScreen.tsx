import React, {useCallback, useMemo, useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import {AlertNoticeBanner} from 'components/content/AlertNoticeBanner';
import {Button} from 'components/content/Button';
import {GeneralNoticeBanner} from 'components/content/GeneralNoticeBanner';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {ToggleRow} from 'components/content/ToggleRow';
import {VStack} from 'components/core';
import {BodySemibold} from 'components/text';
import {useAvalancheCentersMetadata} from 'hooks/useAvalancheCentersMetadata';
import {logger} from 'logger';
import {MainStackParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenter, AvalancheForecastZoneStatus} from 'types/nationalAvalancheCenter';

const NOTIFICATIONS_ENABLED = 'Notifications enabled';
const NOTIFICATIONS_DISABLED = 'Notifications disabled';
const DENIED_BODY = "Notifications are turned off for Avy in your phone's Settings, so we can't send critical alerts.";

export const ManageNotificationsScreen = ({navigation, route}: NativeStackScreenProps<MainStackParamList, 'manageNotifications'>) => {
  const {permissionStatus, followedCenterIds} = route.params;
  const [notificationsEnabled, setNotificationsEnabled] = useState(permissionStatus === 'granted');
  const metadataResults = useAvalancheCentersMetadata(followedCenterIds);

  const turnOnNotifications = useCallback(() => {
    logger.info('turn on notifications pressed');
    setNotificationsEnabled(true);
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(err => logger.error('An error occurred while trying to open the Settings', err));
  }, []);

  const followCenter = useCallback(() => {
    navigation.navigate('avalancheCenterNotificationsSelector', {selectedCenterIds: followedCenterIds});
  }, [navigation, followedCenterIds]);

  const onNotificationsEnabledChange = useCallback(
    (value: boolean) => {
      if (permissionStatus === 'undetermined' && value) {
        turnOnNotifications();
      } else {
        setNotificationsEnabled(value);
      }
    },
    [permissionStatus, turnOnNotifications],
  );

  const insets = useSafeAreaInsets();

  const showFollowedCenters = permissionStatus !== 'denied' && notificationsEnabled;

  return (
    <ScrollView contentContainerStyle={[styles.content, {paddingBottom: insets.bottom}]}>
      <VStack space={12}>
        {permissionStatus === 'undetermined' && !notificationsEnabled && (
          <GeneralNoticeBanner
            iconName="notifications-outline"
            title="Get Notified"
            subtitle="Get notified about avalanche warnings."
            buttonTitle="Turn on notifications"
            onPress={turnOnNotifications}
          />
        )}
        {permissionStatus === 'denied' && <AlertNoticeBanner body={DENIED_BODY} iconName="warning-outline" actionTitle="Open Settings" onAction={openSettings} />}
        <ToggleRow
          title={NOTIFICATIONS_ENABLED}
          value={permissionStatus !== 'denied' && notificationsEnabled}
          onValueChange={onNotificationsEnabledChange}
          disabled={permissionStatus === 'denied'}
        />
        {showFollowedCenters && followedCenterIds.length === 0 && (
          <GeneralNoticeBanner
            iconName="triangle-outline"
            title="Follow an avalanche center"
            subtitle="Notifications are on, but you aren't following any avalanche centers yet. Follow one to get its warnings."
            buttonTitle="Follow a center"
            onPress={followCenter}
          />
        )}
        {showFollowedCenters && followedCenterIds.length > 0 && (
          <>
            <Button buttonStyle="secondary" onPress={followCenter}>
              <BodySemibold>Follow other centers</BodySemibold>
            </Button>
            {incompleteQueryState(...metadataResults) ? (
              <QueryState results={metadataResults} />
            ) : (
              metadataResults.map(result => result.data && <FollowedCenterSection key={result.data.id} center={result.data} />)
            )}
          </>
        )}
      </VStack>
    </ScrollView>
  );
};

const FollowedCenterSection: React.FC<{center: AvalancheCenter}> = ({center}) => {
  const zones = useMemo(() => center.zones.filter(zone => zone.status === AvalancheForecastZoneStatus.Active), [center.zones]);
  const [enabledZoneIds, setEnabledZoneIds] = useState<Set<number>>(() => new Set(zones.map(zone => zone.id)));

  const zoneToggleHandlers = useMemo(
    () =>
      Object.fromEntries(
        zones.map(zone => [
          zone.id,
          (value: boolean) =>
            setEnabledZoneIds(current => {
              const next = new Set(current);
              if (value) {
                next.add(zone.id);
              } else {
                next.delete(zone.id);
              }
              return next;
            }),
        ]),
      ) as Record<number, (value: boolean) => void>,
    [zones],
  );

  return (
    <VStack space={12}>
      <BodySemibold color="text.tertiary">{center.name}</BodySemibold>
      {zones.map(zone => {
        const enabled = enabledZoneIds.has(zone.id);
        return (
          <ToggleRow
            key={zone.id}
            title={zone.name}
            subtitle={enabled ? NOTIFICATIONS_ENABLED : NOTIFICATIONS_DISABLED}
            value={enabled}
            onValueChange={zoneToggleHandlers[zone.id]}
          />
        );
      })}
    </VStack>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    flexGrow: 1,
    backgroundColor: colorLookup('white'),
  },
});
