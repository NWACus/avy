import React from 'react';

import {Button, StyleSheet, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import * as Updates from 'expo-updates';

import {HStack, VStack, Divider, SectionList, View} from 'native-base';

import {AvalancheCenterCard, AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import {MenuStackParamList, MenuStackNavigationProps} from 'routes';
import {useNavigation} from '@react-navigation/native';
import {
  AllCapsSm,
  AllCapsSmBlack,
  Body,
  BodyBlack,
  BodySemibold,
  BodySm,
  BodySmBlack,
  BodySmSemibold,
  BodyXSm,
  BodyXSmBlack,
  BodyXSmMedium,
  Caption1,
  Caption1Black,
  Caption1Semibold,
  FeatureTitleBlack,
  Title1,
  Title1Black,
  Title1Semibold,
  Title3,
  Title3Black,
  Title3Semibold,
} from 'components/text';
import {AvalancheCenterID} from '../../types/nationalAvalancheCenter';

const MenuStack = createNativeStackNavigator<MenuStackParamList>();
export const MenuStackScreen = (
  avalancheCenterId: AvalancheCenterID,
  setAvalancheCenter: React.Dispatch<React.SetStateAction<AvalancheCenterID>>,
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
      <MenuStack.Screen name="textStylePreview" component={TextStylePreview} options={{title: `Text style preview`}} />
    </MenuStack.Navigator>
  );
};

export const MenuScreen = (avalancheCenterId: AvalancheCenterID, staging: boolean, setStaging: React.Dispatch<React.SetStateAction<boolean>>) => {
  const toggleStaging = React.useCallback(() => {
    setStaging(!staging);
    console.log(`Switching to ${staging ? 'production' : 'staging'} environment`);
  }, [staging, setStaging]);
  const navigation = useNavigation<MenuStackNavigationProps>();
  return function (_: NativeStackScreenProps<MenuStackParamList, 'menu'>) {
    return (
      <SafeAreaView style={styles.fullscreen}>
        <VStack pt="16" px="4" space="4" style={styles.fullscreen}>
          <FeatureTitleBlack>Settings</FeatureTitleBlack>
          <Divider orientation="horizontal" bg="light.200" />
          {Updates.channel !== 'production' && (
            <>
              <Title1Black>Debug Settings</Title1Black>
              <HStack justifyContent="space-between" alignItems="center" space="4">
                <BodyBlack>Use staging environment</BodyBlack>
                <Switch value={staging} onValueChange={toggleStaging} />
              </HStack>
              <VStack alignItems="flex-start">
                <BodyBlack>Choose Avalanche Center</BodyBlack>
                <AvalancheCenterCard
                  avalancheCenterId={avalancheCenterId}
                  selected={false}
                  onPress={() => {
                    navigation.navigate('avalancheCenterSelector');
                  }}
                />
              </VStack>
              <Button onPress={() => navigation.navigate('textStylePreview')} title="Open text style preview" />
            </>
          )}
        </VStack>
      </SafeAreaView>
    );
  };
};

const TextStylePreview = () => {
  const data = [
    {
      title: 'Feature title',
      data: [{Component: FeatureTitleBlack, content: 'Feature Title Black'}],
    },
    {
      title: 'Title 1',
      data: [
        {Component: Title1, content: 'Title 1 Regular'},
        {Component: Title1Semibold, content: 'Title 1 Semibold'},
        {Component: Title1Black, content: 'Title 1 Black'},
      ],
    },
    {
      title: 'Title 3',
      data: [
        {Component: Title3, content: 'Title 3 Regular'},
        {Component: Title3Semibold, content: 'Title 3 Semibold'},
        {Component: Title3Black, content: 'Title 3 Black'},
      ],
    },
    {
      title: 'Body',
      data: [
        {Component: Body, content: 'Body Regular'},
        {Component: BodySemibold, content: 'Body Semibold'},
        {Component: BodyBlack, content: 'Body Black'},
      ],
    },
    {
      title: 'Body Small',
      data: [
        {Component: BodySm, content: 'Body small Regular'},
        {Component: BodySmSemibold, content: 'Body small Semibold'},
        {Component: BodySmBlack, content: 'Body small Black'},
      ],
    },
    {
      title: 'Body Extra Small',
      data: [
        {Component: BodyXSm, content: 'Body xsml Regular'},
        {Component: BodyXSmMedium, content: 'Body xsml Medium'},
        {Component: BodyXSmBlack, content: 'Body xsml Black'},
      ],
    },
    {
      title: 'All Caps Small',
      data: [
        {Component: AllCapsSm, content: 'All caps small medium'},
        {Component: AllCapsSmBlack, content: 'All caps small Black'},
      ],
    },
    {
      title: 'Caption',
      data: [
        {Component: Caption1, content: 'Caption 1 Regular'},
        {Component: Caption1Semibold, content: 'Caption 1 Semibold'},
        {Component: Caption1Black, content: 'Caption 1 Black'},
      ],
    },
  ];
  return (
    <SafeAreaView style={styles.fullscreen}>
      <SectionList
        paddingX={4}
        sections={data}
        keyExtractor={item => item.content}
        renderItem={({item}) => <item.Component>{item.content}</item.Component>}
        renderSectionHeader={() => <View height="4" />}
      />
    </SafeAreaView>
  );
};

export const AvalancheCenterSelectorScreen = (avalancheCenterId: AvalancheCenterID, setAvalancheCenter: React.Dispatch<React.SetStateAction<AvalancheCenterID>>) => {
  return function (_: NativeStackScreenProps<MenuStackParamList, 'avalancheCenterSelector'>) {
    return <AvalancheCenterSelector currentCenterId={avalancheCenterId} setAvalancheCenter={setAvalancheCenter} />;
  };
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
  },
});
