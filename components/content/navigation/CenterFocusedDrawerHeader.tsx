import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, VStack} from 'components/core';
import {BodySm, Title3Semibold} from 'components/text';
import React from 'react';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface CenterFocusedDrawerHeader {
  avalancheCenterId: AvalancheCenterID;
  centerFullName: string;
  centerDisplayId: string;
  centerDescription: string;
}

export const CenterFocusedDrawerHeader: React.FunctionComponent<CenterFocusedDrawerHeader> = ({avalancheCenterId, centerFullName, centerDisplayId, centerDescription}) => (
  <HStack justifyContent="space-between" alignItems="center" space={12} paddingHorizontal={12} paddingBottom={12} minHeight={86}>
    <AvalancheCenterLogo style={{height: 60, width: 60, resizeMode: 'contain', flex: 0, flexGrow: 0, marginTop: 4}} avalancheCenterId={avalancheCenterId} />
    <VStack flexShrink={1} flexGrow={1}>
      <Title3Semibold color={colorLookup('white')}>
        {centerFullName} ({centerDisplayId})
      </Title3Semibold>
      <BodySm color={colorLookup('white')}>{centerDescription}</BodySm>
    </VStack>
  </HStack>
);
