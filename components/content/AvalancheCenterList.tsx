import React from 'react';

import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, VStack, VStackProps} from 'components/core';
import {BodyBlack, BodySm} from 'components/text';
import Checkbox from 'expo-checkbox';
import {AvalancheCenterListData} from 'hooks/useAvalancheCenters';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface AvalancheCenterListItemProps {
  data: AvalancheCenterListData;
  selected: boolean;
  setSelected: (center: AvalancheCenterID) => void;
}
const AvalancheCenterListItem: React.FC<AvalancheCenterListItemProps> = ({data, selected, setSelected}) => {
  return (
    <HStack justifyContent="space-between" alignItems="flex-start" space={4}>
      <HStack space={8} flexShrink={1} alignItems="flex-start">
        <AvalancheCenterLogo style={{height: 24, width: 24, resizeMode: 'contain', flex: 0, flexGrow: 0}} avalancheCenterId={data.center} />
        <VStack space={2} flexShrink={1}>
          <BodyBlack>{data.title}</BodyBlack>
          {data.subtitle && <BodySm>{data.subtitle}</BodySm>}
        </VStack>
      </HStack>
      <Checkbox
        color={colorLookup('primary')}
        value={selected}
        onValueChange={() => setSelected(data.center)}
        style={{margin: 8, borderRadius: 16, borderColor: colorLookup('primary')}}
      />
    </HStack>
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
      <AvalancheCenterListItem key={item.center} data={item} selected={item.center === selectedCenter} setSelected={setSelectedCenter} />
    ))}
  </VStack>
);
