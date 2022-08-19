import React from 'react';

import {Text, View, SectionList, SectionListData, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {AvalancheCenterLogo} from './AvalancheCenterLogo';
import {useAvalancheCenterMetadata} from '../hooks/useAvalancheCenterMetadata';

const center_idsByType: SectionListData<string>[] = [
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
  center_id: string;
  date: string;
}

const AvalancheCenterCard: React.FunctionComponent<AvalancheCenterCardProps> = ({center_id, date}: AvalancheCenterCardProps) => {
  const navigation = useNavigation();
  const {isLoading, isError, data: avalancheCenter, error} = useAvalancheCenterMetadata(center_id);
  if (isLoading) {
    return <ActivityIndicator style={styles.item} />;
  }
  if (isError) {
    return (
      <View style={styles.item}>
        <Text>{`Could not fetch data for ${center_id}: ${error?.message}.`}</Text>
      </View>
    );
  }
  if (!avalancheCenter) {
    return (
      <View style={styles.item}>
        <Text>{`No metadata found for ${center_id}.`}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('zoneSelector', {center_id: center_id, date: date})}>
      <AvalancheCenterLogo style={styles.logo} center_id={center_id} />
      <Text style={{textAlignVertical: 'center'}}>{avalancheCenter.name}</Text>
    </TouchableOpacity>
  );
};

export interface AvalancheCenterSelectorProps {
  date: string;
}

export const AvalancheCenterSelector: React.FunctionComponent<AvalancheCenterSelectorProps> = ({date}: AvalancheCenterSelectorProps) => {
  return (
    <SectionList
      style={styles.container}
      sections={center_idsByType}
      keyExtractor={item => item}
      renderItem={({item}) => <AvalancheCenterCard center_id={item} date={date} />}
      renderSectionHeader={({section: {title}}) => <Text style={styles.title}>{title + ' Centers'}</Text>}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
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
