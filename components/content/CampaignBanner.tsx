import * as React from 'react';

import {Button} from 'components/content/Button';
import {HStack, VStack, ViewProps} from 'components/core';
import {BodyBlack, BodySemibold, BodySm} from 'components/text';
import {colorLookup} from 'theme';
import {AvalancheCenterID, userFacingCenterId} from 'types/nationalAvalancheCenter';

interface CampaignBannerProps extends ViewProps {
  center: AvalancheCenterID;
  onAction?: () => void;
}

export const CampaignBanner = ({center, onAction = () => undefined, ...props}: CampaignBannerProps) => (
  <HStack height={82} mx={8} my={12} px={16} py={16} justifyContent="space-between" backgroundColor={colorLookup('NWAC-dark')} borderRadius={10} {...props}>
    <VStack space={2}>
      <BodySemibold color="white">❄️ {userFacingCenterId(center)} Year End Giving</BodySemibold>
      <BodySm color="white">The app relies on your support</BodySm>
    </VStack>
    <Button buttonStyle="primary" onPress={onAction}>
      <BodyBlack color="white">Donate</BodyBlack>
    </Button>
  </HStack>
);
