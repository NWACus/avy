import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {CommonActions} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Checkbox from 'expo-checkbox';

import {avalancheCenterList, AvalancheCenterListData, nacAvalancheCenterDescriptions} from 'components/avalancheCenterList';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, VStack} from 'components/core';
import {Body, BodySemibold} from 'components/text';
import {useAllAvalancheCenterMetadata} from 'hooks/useAllAvalancheCenterMetadata';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {MainStackParamList} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenter, AvalancheCenterID} from 'types/nationalAvalancheCenter';

const CENTER_ORDER = nacAvalancheCenterDescriptions().map(description => description.center);

export const AvalancheCenterNotificationsSelector = ({navigation, route}: NativeStackScreenProps<MainStackParamList, 'avalancheCenterNotificationsSelector'>) => {
  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;
  const metadataResults = useAllAvalancheCenterMetadata(capabilities);
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<AvalancheCenterID>>(() => new Set(route.params.selectedCenterIds));
  const insets = useSafeAreaInsets();

  const onToggleCenter = useCallback(
    (centerId: AvalancheCenterID) => {
      const next = new Set(selectedCenterIds);
      if (next.has(centerId)) {
        next.delete(centerId);
      } else {
        next.add(centerId);
      }
      setSelectedCenterIds(next);

      const followedCenterIds = Array.from(next).sort((a, b) => CENTER_ORDER.indexOf(a) - CENTER_ORDER.indexOf(b));
      navigation.dispatch(state => {
        const manageNotificationsRoute = state.routes.findLast(stackRoute => stackRoute.name === 'manageNotifications');
        return {...CommonActions.setParams({followedCenterIds}), source: manageNotificationsRoute?.key};
      });
    },
    [selectedCenterIds, navigation],
  );

  if (incompleteQueryState(capabilitiesResult, ...metadataResults) || !capabilities) {
    return <QueryState results={[capabilitiesResult, ...metadataResults]} />;
  }

  const metadata: AvalancheCenter[] = [];
  for (const result of metadataResults) {
    if (result.data) {
      metadata.push(result.data);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, {paddingBottom: insets.bottom}]}>
      <VStack space={8}>
        {avalancheCenterList(metadata, capabilities).map(item => (
          <AvalancheCenterNotificationsSelectorItem
            key={item.center.id}
            data={item}
            selected={selectedCenterIds.has(item.center.id as AvalancheCenterID)}
            onToggle={onToggleCenter}
          />
        ))}
      </VStack>
    </ScrollView>
  );
};

interface AvalancheCenterNotificationsSelectorItemProps {
  data: AvalancheCenterListData;
  selected: boolean;
  onToggle: (centerId: AvalancheCenterID) => void;
}

const AvalancheCenterNotificationsSelectorItem: React.FC<AvalancheCenterNotificationsSelectorItemProps> = ({data, selected, onToggle}) => {
  const centerId = data.center.id as AvalancheCenterID;
  const onPress = useCallback(() => onToggle(centerId), [onToggle, centerId]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="checkbox" accessibilityState={{checked: selected}}>
      <HStack style={styles.item} space={12} alignItems="center">
        <AvalancheCenterLogo style={styles.logo} avalancheCenterId={centerId} />
        <VStack flex={1} space={2}>
          <BodySemibold>
            {data.center.name} ({data.display_id})
          </BodySemibold>
          {data.description && <Body color="text.tertiary">{data.description}</Body>}
        </VStack>
        <Checkbox value={selected} onValueChange={onPress} color={selected ? colorLookup('primary') : colorLookup('border.base')} />
      </HStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorLookup('white'),
  },
  content: {
    padding: 16,
  },
  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: colorLookup('border.base'),
    borderRadius: 8,
    backgroundColor: colorLookup('white'),
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});
