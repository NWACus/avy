import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {HStack, VStack} from 'components/core';
import {BodySm, BodySmSemibold} from 'components/text';
import React from 'react';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface CenterFocusedDrawerHeaer {
  avalancheCenterId: AvalancheCenterID;
  centerFullName: string;
  centerDisplayId: string;
  centerDescription: string;
}

export const CenterFocusedDrawerHeaer: React.FunctionComponent<CenterFocusedDrawerHeaer> = ({avalancheCenterId, centerFullName, centerDisplayId, centerDescription}) => (
  <HStack justifyContent="space-between" alignItems="center" space={12} padding={12} minHeight={86}>
    <AvalancheCenterLogo style={{height: 60, width: 60, resizeMode: 'contain', flex: 0, flexGrow: 0, marginTop: 4}} avalancheCenterId={avalancheCenterId} />
    <VStack flexShrink={1} flexGrow={1}>
      <BodySmSemibold color={colorLookup('white')}>
        {centerFullName} ({centerDisplayId})
      </BodySmSemibold>
      <BodySm color={colorLookup('white')}>{centerDescription}</BodySm>
    </VStack>
  </HStack>
);
