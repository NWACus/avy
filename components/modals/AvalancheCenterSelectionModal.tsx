import Topo from 'assets/illustrations/topo.svg';
import {AvalancheCenterLogo} from 'components/AvalancheCenterLogo';
import {Button} from 'components/content/Button';
import {Center, HStack, View, VStack} from 'components/core';
import {Body, BodyBlack, BodySm, Title3Semibold} from 'components/text';
import Checkbox from 'expo-checkbox';
import {useCallback, useState} from 'react';
import {Modal} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

export interface AvalancheCenterSelectionModalProps {
  visible: boolean;
  initialSelection: AvalancheCenterID;
  onClose: (center: AvalancheCenterID) => void;
}

interface CenterData {
  center: AvalancheCenterID;
  name: string;
  mission: string;
}

const avalancheCenters: CenterData[] = [
  {
    center: 'NWAC',
    name: 'Northwest Avalanche Center',
    mission: 'The Northwest Avalanche Center (NWAC) produces daily avalanche forecasts for 10 zones across Washington State and northern Oregon.',
  },
  {
    center: 'SNFAC',
    name: 'Sawtooth Avalanche Center',
    mission: 'The Sawtooth Avalanche Center provides avalanche information and education for South Central Idaho.',
  },
];

interface AvalancheCenterListItemProps {
  data: CenterData;
  selected: boolean;
  setSelected: (center: AvalancheCenterID) => void;
}
const AvalancheCenterListItem: React.FC<AvalancheCenterListItemProps> = ({data, selected, setSelected}) => {
  return (
    <HStack justifyContent="space-between" alignItems="flex-start" space={4}>
      <AvalancheCenterLogo style={{height: 24, width: 24, resizeMode: 'contain'}} avalancheCenterId={data.center} />
      <VStack space={2} flexShrink={1}>
        <BodyBlack>{data.name}</BodyBlack>
        <BodySm>{data.mission}</BodySm>
      </VStack>
      <Checkbox
        color={colorLookup('primary')}
        value={selected}
        onValueChange={() => setSelected(data.center)}
        style={{margin: 8, borderRadius: 16, borderColor: colorLookup('primary')}}
      />
    </HStack>
  );
};

export const AvalancheCenterSelectionModal: React.FC<AvalancheCenterSelectionModalProps> = ({visible, initialSelection, onClose}) => {
  const [selectedCenter, setSelectedCenter] = useState(initialSelection);
  const closeHandler = useCallback(() => {
    onClose(selectedCenter);
  }, [onClose, selectedCenter]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={closeHandler}>
      <SafeAreaProvider>
        <SafeAreaView style={{backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
          <Center width="100%" height="100%" px={48}>
            <VStack alignItems="stretch" bg="white" borderRadius={16} px={12} py={24} space={8} width="100%" position="relative" overflow="hidden">
              <Center mb={4}>
                <Title3Semibold>Welcome! Let’s Get Started</Title3Semibold>
              </Center>
              <Body>Select your local avalanche center to start using the app. You can change this anytime in settings.</Body>
              <VStack space={8} mt={8}>
                {avalancheCenters.map(data => (
                  <AvalancheCenterListItem key={data.center} data={data} selected={data.center === selectedCenter} setSelected={setSelectedCenter} />
                ))}
              </VStack>
              <Button onPress={closeHandler} alignSelf="stretch" buttonStyle="primary" mt={16}>
                <BodyBlack>Continue</BodyBlack>
              </Button>
              {/* placeholder view to create space for the topo illustration */}
              <View height={200} />
              {/* these magic numbers are yanked out of Figma */}
              <Topo width={887.0152587890625} height={456.3430480957031} style={{position: 'absolute', left: -364, top: 382}} />
            </VStack>
          </Center>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};
