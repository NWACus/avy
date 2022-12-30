import React from 'react';

import {Box, VStack, HStack, Text as NBText} from 'native-base';
import {Text, SectionList, SectionListData, StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {AvalancheCenterLogo} from './AvalancheCenterLogo';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {TabNavigationProps} from 'routes';

const avalancheCenterIDsByType: SectionListData<string>[] = [
  {
    title: 'Forest Service',
    data: [
      'BTAC', // Bridger-Teton: ID, WY
      'CNFAIC', // Chugach: AK
      'FAC', // Flathead: MT
      'GNFAC', // Gallatin: MT, WY, ID
      'IPAC', // Idaho Panhandle: ID, MT
      'NWAC', // Northwest: WA, OR
      'MSAC', // Mount Shasta: CA
      'MWAC', // Mount Washington: NH
      'PAC', // Payette: ID
      'SNFAC', // Sawtooths: ID
      'SAC', // Sierra: CA
      'WCMAC', // West Central Montana: MT
    ],
  },
  {
    title: 'State',
    data: [
      'CAIC', // Colorado: CO
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
  avalancheCenterId: string;
  selected: boolean;
  onPress: (avalancheCenter: string) => void;
}

export const AvalancheCenterCard: React.FunctionComponent<AvalancheCenterCardProps> = ({avalancheCenterId, selected, onPress}: AvalancheCenterCardProps) => {
  const {width, height} = useWindowDimensions();
  const {isLoading, isError, data: avalancheCenter, error} = useAvalancheCenterMetadata(avalancheCenterId);
  if (isLoading) {
    return <ActivityIndicator style={styles.item} />;
  }
  if (isError) {
    return (
      <Box>
        <Box bg="light.100">
          <VStack>
            <HStack justifyContent="flex-start" alignItems="center">
              <NBText color="light.400">{`Could not fetch data for ${avalancheCenterId}: ${error?.message}.`}</NBText>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  }
  if (!avalancheCenter) {
    return (
      <Box>
        <Box bg="light.100">
          <VStack>
            <HStack justifyContent="flex-start" alignItems="center">
              <NBText color="light.400">{`No metadata found for ${avalancheCenterId}.`}</NBText>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          onPress(avalancheCenterId);
        }}>
        <Box bg={selected ? 'blue.100' : 'light.100'}>
          <VStack>
            <HStack justifyContent="flex-start" alignItems="center" px="2" width={width}>
              <AvalancheCenterLogo style={{height: height / 20}} avalancheCenterId={avalancheCenterId} />
              <NBText px="2" color="light.400">
                {avalancheCenter.name}
              </NBText>
            </HStack>
          </VStack>
        </Box>
      </TouchableOpacity>
    </Box>
  );
};

export const AvalancheCenterSelector = ({currentCenterId, setAvalancheCenter}) => {
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
          onPress={(avalancheCenter: string) => {
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
      renderSectionHeader={({section: {title}}) => <Text style={styles.title}>{title + ' Centers'}</Text>}
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
