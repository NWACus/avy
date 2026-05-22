import React from 'react';

import {AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {MainStackParamList} from 'routes';

import {AvalancheCenters} from 'components/avalancheCenterList';

import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const AvalancheCenterSelectorScreen = (centers: AvalancheCenters, avalancheCenterId: AvalancheCenterID, setAvalancheCenter: (center: AvalancheCenterID) => void) => {
  const AvalancheCenterSelectorScreen = function (_: NativeStackScreenProps<MainStackParamList, 'avalancheCenterSelector'>) {
    return <AvalancheCenterSelector currentCenterId={avalancheCenterId} setAvalancheCenter={setAvalancheCenter} />;
  };
  AvalancheCenterSelectorScreen.displayName = 'AvalancheCenterSelectorScreen';
  return AvalancheCenterSelectorScreen;
};
