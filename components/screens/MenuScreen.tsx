import React from 'react';

import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import * as Updates from 'expo-updates';

import {Heading, HStack, VStack, Switch, Text, Divider} from 'native-base';

import {AvalancheCenterCard, AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {MenuStackParamList, MenuStackNavigationProps} from 'routes';
import {useNavigation} from '@react-navigation/native';

const MenuStack = createNativeStackNavigator<MenuStackParamList>();
export const MenuStackScreen = (
  avalancheCenterId: string,
  setAvalancheCenter: React.Dispatch<React.SetStateAction<string>>,
  staging: boolean,
  setStaging: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  return (
    <MenuStack.Navigator initialRouteName="menu">
      <MenuStack.Screen name="menu" component={MenuScreen(avalancheCenterId, staging, setStaging)} options={{title: `Settings`}} />
      <MenuStack.Screen
        name="avalancheCenterSelector"
        component={AvalancheCenterSelectorScreen(avalancheCenterId, setAvalancheCenter)}
        options={{title: `Choose An Avalanche Center`}}
      />
    </MenuStack.Navigator>
  );
};

export const MenuScreen = (avalancheCenterId: string, staging: boolean, setStaging: React.Dispatch<React.SetStateAction<boolean>>) => {
  const toggleStaging = React.useCallback(() => {
    setStaging(!staging);
    console.log(`Switching to ${staging ? 'production' : 'staging'} environment`);
  }, [staging, setStaging]);
  const navigation = useNavigation<MenuStackNavigationProps>();
  return function (_: NativeStackScreenProps<MenuStackParamList, 'menu'>) {
    return (
      <SafeAreaView style={styles.fullscreen}>
        <VStack pt="16" px="4" space="4" style={styles.fullscreen}>
          <Heading>Settings</Heading>
          <Divider orientation="horizontal" bg="light.200" />
          {Updates.channel !== 'production' && (
            <>
              <Heading size="sm">Debug Settings</Heading>
              <HStack justifyContent="space-between" alignItems="center" space="4">
                <Text>Use staging environment</Text>
                <Switch value={staging} onValueChange={toggleStaging} />
              </HStack>
              <VStack alignItems="flex-start">
                <Text>Choose Avalanche Center</Text>
                <AvalancheCenterCard
                  avalancheCenterId={avalancheCenterId}
                  selected={false}
                  onPress={() => {
                    navigation.navigate('avalancheCenterSelector');
                  }}
                />
              </VStack>
            </>
          )}
        </VStack>
      </SafeAreaView>
    );
  };
};

export const AvalancheCenterSelectorScreen = (avalancheCenterId: string, setAvalancheCenter: React.Dispatch<React.SetStateAction<string>>) => {
  return function (_: NativeStackScreenProps<MenuStackParamList, 'avalancheCenterSelector'>) {
    return <AvalancheCenterSelector currentCenterId={avalancheCenterId} setAvalancheCenter={setAvalancheCenter} />;
  };
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
  },
});
