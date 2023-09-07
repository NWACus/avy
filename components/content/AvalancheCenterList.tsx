import React from 'react';

import {AvalancheCenterListData} from 'components/avalancheCenterList';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, VStack, VStackProps} from 'components/core';
import {Body} from 'components/text';
import Checkbox from 'expo-checkbox';
import {TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface AvalancheCenterListItemProps {
  data: AvalancheCenterListData;
  selected: boolean;
  setSelected: (center: AvalancheCenterID) => void;
}
const AvalancheCenterListItem: React.FC<AvalancheCenterListItemProps> = ({data, selected, setSelected}) => {
  const center_id: AvalancheCenterID = data.center.id as AvalancheCenterID;
  return (
    <TouchableOpacity onPress={() => setSelected(center_id)} activeOpacity={0.8}>
      <HStack justifyContent="space-between" alignItems="flex-start" space={4}>
        <HStack space={8} flexShrink={1} alignItems="flex-start">
          <AvalancheCenterLogo style={{height: 24, width: 24, resizeMode: 'contain', flex: 0, flexGrow: 0}} avalancheCenterId={center_id} />
          <VStack space={2} flexShrink={1}>
            <Body>
              {data.center.name} ({center_id})
            </Body>
          </VStack>
        </HStack>
        <Checkbox
          color={colorLookup('primary')}
          value={selected}
          onValueChange={() => setSelected(center_id)}
          style={{margin: 8, borderRadius: 16, borderColor: colorLookup('primary')}}
        />
      </HStack>
    </TouchableOpacity>
  );
};

interface AvalancheCenterListProps extends VStackProps {
  selectedCenter: AvalancheCenterID;
  setSelectedCenter: (center: AvalancheCenterID) => void;
  data: AvalancheCenterListData[];
}

export const AvalancheCenterList: React.FC<AvalancheCenterListProps> = ({selectedCenter, setSelectedCenter, data, ...stackProps}) => (
  <VStack space={8} {...stackProps}>
    {data.map(item => (
      <AvalancheCenterListItem key={item.center.id} data={item} selected={(item.center.id as AvalancheCenterID) === selectedCenter} setSelected={setSelectedCenter} />
    ))}
  </VStack>
);
