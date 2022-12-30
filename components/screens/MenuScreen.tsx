import React from 'react';

import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import * as Updates from 'expo-updates';

import {Heading, HStack, VStack, Switch, Text} from 'native-base';

import {AvalancheCenterCard, AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {MenuStackParamList, MenuStackNavigationProps} from 'routes';
import {useNavigation} from '@react-navigation/native';

const MenuStack = createNativeStackNavigator<MenuStackParamList>();
export const MenuStackScreen = (
  center_id: string,
  setAvalancheCenter: React.Dispatch<React.SetStateAction<string>>,
  staging: boolean,
  setStaging: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  return (
    <MenuStack.Navigator initialRouteName="menu">
      <MenuStack.Screen name="menu" component={MenuScreen(staging, setStaging)} initialParams={{current_center_id: center_id}} options={{title: `Settings`}} />
      <MenuStack.Screen
        name="avalancheCenterSelector"
        component={AvalancheCenterSelectorScreen(setAvalancheCenter)}
        initialParams={{current_center_id: center_id}}
        options={{title: `Choose An Avalanche Center`}}
      />
    </MenuStack.Navigator>
  );
};

export const MenuScreen = (staging: boolean, setStaging: React.Dispatch<React.SetStateAction<boolean>>) => {
  const toggleStaging = React.useCallback(() => {
    setStaging(!staging);
    console.log(`Switching to ${staging ? 'production' : 'staging'} environment`);
  }, [staging, setStaging]);
  const navigation = useNavigation<MenuStackNavigationProps>();
  return function ({route}: NativeStackScreenProps<MenuStackParamList, 'menu'>) {
    const {current_center_id} = route.params;
    return (
      <SafeAreaView style={styles.fullscreen}>
        <VStack pt="16" px="4" space="4" style={styles.fullscreen}>
          <Heading>Settings</Heading>
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
                  center_id={current_center_id}
                  selected={false}
                  onPress={() => {
                    navigation.navigate('avalancheCenterSelector', {
                      current_center_id: current_center_id,
                    });
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

export const AvalancheCenterSelectorScreen = (setAvalancheCenter: React.Dispatch<React.SetStateAction<string>>) => {
  return function ({route}: NativeStackScreenProps<MenuStackParamList, 'avalancheCenterSelector'>) {
    const {current_center_id} = route.params;
    return <AvalancheCenterSelector currentCenterId={current_center_id} setAvalancheCenter={setAvalancheCenter} />;
  };
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
  },
  logo: {
    height: '100%',
  },
});
