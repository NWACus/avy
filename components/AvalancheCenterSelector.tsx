import React from 'react';

import {useNavigation} from '@react-navigation/native';
import {SectionList, SectionListData, StyleSheet, Text, TouchableOpacity, useWindowDimensions} from 'react-native';

import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {Body} from 'components/text';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {TabNavigationProps} from 'routes';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

const avalancheCenterIDsByType: SectionListData<AvalancheCenterID>[] = [
  {
    title: 'Forest Service',
    data: [
      'BAC', // Bridgeport: CA
      'BTAC', // Bridger-Teton: ID, WY
      'FAC', // Flathead: MT
      'IPAC', // Idaho Panhandle: ID, MT
      'KPAC', // Kachina: AZ
      'NWAC', // Northwest: WA, OR
      'MSAC', // Mount Shasta: CA
      'MWAC', // Mount Washington: NH
      'PAC', // Payette: ID
      'SNFAC', // Sawtooths: ID
      'SAC', // Sierra: CA
      'TAC', // Taos: NM
      'WCMAC', // West Central Montana: MT
    ],
  },
  {
    title: 'Local Non-Profit',
    data: [
      'COAA', // Central Oregon: OR
      'CBAC', // Crested Butte: CO
      'ESAC', // Eastern Sierra: CA
      'WAC', // Wallowas: OR
    ],
  },
];

interface AvalancheCenterCardProps {
  avalancheCenterId: AvalancheCenterID;
  selected: boolean;
  onPress: (avalancheCenter: AvalancheCenterID) => void;
}

export const AvalancheCenterCard: React.FunctionComponent<AvalancheCenterCardProps> = ({avalancheCenterId, selected, onPress}: AvalancheCenterCardProps) => {
  const {width} = useWindowDimensions();
  const centerResult = useAvalancheCenterMetadata(avalancheCenterId);
  const avalancheCenter = centerResult.data;
  if (incompleteQueryState(centerResult) || !avalancheCenter) {
    return <QueryState results={[centerResult]} />;
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          onPress(avalancheCenterId);
        }}>
        <View bg={selected ? 'blue.100' : 'light.100'}>
          <VStack>
            <HStack justifyContent="flex-start" alignItems="center" px={8} width={width}>
              <AvalancheCenterLogo style={{height: 36}} avalancheCenterId={avalancheCenterId} />
              <Body style={{paddingHorizontal: 4}} color="light.400">
                {avalancheCenter.name}
              </Body>
            </HStack>
          </VStack>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const AvalancheCenterSelector: React.FunctionComponent<{
  currentCenterId: AvalancheCenterID;
  setAvalancheCenter: React.Dispatch<React.SetStateAction<AvalancheCenterID>>;
}> = ({currentCenterId, setAvalancheCenter}) => {
  const navigation = useNavigation<TabNavigationProps>();
  return (
    <SectionList
      style={styles.container}
      sections={avalancheCenterIDsByType}
      keyExtractor={item => item}
      renderItem={({item}) => (
        <AvalancheCenterCard
          avalancheCenterId={item}
          selected={item === currentCenterId}
          onPress={(avalancheCenter: AvalancheCenterID) => {
            setAvalancheCenter(avalancheCenter);
            // We need to clear navigation state to force all screens from the
            // previous avalanche center selection to unmount
            navigation.reset({
              index: 0,
              routes: [{name: 'Home'}],
            });
          }}
        />
      )}
      renderSectionHeader={({section: {title}}) => <Text style={styles.title}>{String(title) + ' Centers'}</Text>}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    height: 60,
    padding: 2,
    flexDirection: 'row',
    textAlignVertical: 'center',
  },
  logo: {
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    paddingBottom: 5,
    elevation: 4,
  },
});
