import React, {useCallback} from 'react';

import {AvalancheCenterListData} from 'components/avalancheCenterList';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, VStack, VStackProps} from 'components/core';
import {Body, BodySemibold} from 'components/text';
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
  const onPress = useCallback(() => setSelected(center_id), [setSelected, center_id]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <HStack
        justifyContent="space-between"
        alignItems="flex-start"
        backgroundColor={'white'}
        space={12}
        margin={selected ? 0 : 1}
        borderWidth={selected ? 2 : 1}
        borderColor={colorLookup(selected ? 'primary' : 'light.300')}
        borderRadius={8}
        padding={12}
        minHeight={86}>
        <AvalancheCenterLogo style={{height: 32, width: 32, resizeMode: 'contain', flex: 0, flexGrow: 0, marginTop: 4}} avalancheCenterId={center_id} />
        <VStack space={2} flexShrink={1} flexGrow={1}>
          <BodySemibold>
            {data.center.name} ({data.display_id})
          </BodySemibold>
          <Body>{data.description}</Body>
        </VStack>
      </HStack>
    </TouchableOpacity>
  );
};

interface AvalancheCenterListProps extends VStackProps {
  selectedCenter?: AvalancheCenterID;
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
