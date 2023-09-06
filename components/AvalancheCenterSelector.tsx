import React from 'react';

import {useNavigation, useRoute} from '@react-navigation/native';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AvalancheCenterList} from 'components/content/AvalancheCenterList';
import {AvalancheCenters, useAvalancheCenters} from 'hooks/useAvalancheCenters';
import {MenuStackParamList, TabNavigationProps} from 'routes';
import {ScrollView} from 'tamagui';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const AvalancheCenterSelector: React.FunctionComponent<{
  currentCenterId: AvalancheCenterID;
  setAvalancheCenter: (center: AvalancheCenterID) => void;
}> = ({currentCenterId, setAvalancheCenter}) => {
  const navigation = useNavigation<TabNavigationProps>();
  const route = useRoute<NativeStackScreenProps<MenuStackParamList, 'avalancheCenterSelector'>['route']>();
  const availableCenters = route.params.debugMode ? AvalancheCenters.AllCenters : AvalancheCenters.SupportedCenters;
  const avalancheCenters = useAvalancheCenters(availableCenters);
  const setAvalancheCenterWrapper = React.useCallback(
    (center: AvalancheCenterID) => {
      setAvalancheCenter(center);
      // We need to clear navigation state to force all screens from the
      // previous avalanche center selection to unmount
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    },
    [setAvalancheCenter, navigation],
  );
  return (
    <ScrollView style={{height: '100%', width: '100%'}}>
      <AvalancheCenterList
        selectedCenter={currentCenterId}
        setSelectedCenter={setAvalancheCenterWrapper}
        data={avalancheCenters}
        width="100%"
        height="100%"
        bg="white"
        px={16}
        py={8}
      />
    </ScrollView>
  );
};
