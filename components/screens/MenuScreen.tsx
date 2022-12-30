import {useContext} from 'react';

import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Heading, HStack, VStack, Switch, Text} from 'native-base';

import {ClientContext, ClientProps} from 'clientContext';
import {AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

export const MenuScreen = () => {
  const {staging, toggleStaging, setAvalancheCenter} = useContext<ClientProps>(ClientContext);
  return (
    <SafeAreaView style={styles.fullscreen}>
      <VStack pt="16" px="4" space="4" style={styles.fullscreen}>
        <Heading>Settings</Heading>
        <Heading size="sm">Debug settings</Heading>
        <HStack justifyContent="space-between" alignItems="center" space="4">
          <Text>Use staging environment</Text>
          <Switch value={staging} onValueChange={toggleStaging} />
        </HStack>
        <AvalancheCenterSelector setAvalancheCenter={setAvalancheCenter} />
      </VStack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
  },
});
