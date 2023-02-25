import React from 'react';

import {SectionList, StyleSheet, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import * as Updates from 'expo-updates';

import {AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {MenuStackNavigationProps, MenuStackParamList, TabNavigatorParamList} from 'routes';

import {Divider, HStack, View, VStack} from 'components/core';

import * as Application from 'expo-application';

import {QueryCache} from '@tanstack/react-query';
import {ActionList} from 'components/content/ActionList';
import {Button} from 'components/content/Button';
import {ForecastScreen} from 'components/screens/ForecastScreen';
import {MapScreen} from 'components/screens/MapScreen';
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
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {toISOStringUTC} from 'utils/date';

const MenuStack = createNativeStackNavigator<MenuStackParamList>();
export const MenuStackScreen = (
  {route}: NativeStackScreenProps<TabNavigatorParamList, 'Menu'>,
  queryCache: QueryCache,
  avalancheCenterId: AvalancheCenterID,
  setAvalancheCenter: React.Dispatch<React.SetStateAction<AvalancheCenterID>>,
  staging: boolean,
  setStaging: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const {center_id, requestedTime} = route.params;
  return (
    <MenuStack.Navigator initialRouteName="menu">
      <MenuStack.Screen name="menu" component={MenuScreen(queryCache, avalancheCenterId, staging, setStaging)} options={{title: `Settings`}} />
      <MenuStack.Screen
        name="avalancheCenterSelector"
        component={AvalancheCenterSelectorScreen(avalancheCenterId, setAvalancheCenter)}
        options={{title: `Choose An Avalanche Center`}}
      />
      <MenuStack.Screen name="textStylePreview" component={TextStylePreview} options={{title: `Text style preview`}} />
      <MenuStack.Screen name="avalancheCenter" component={MapScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} options={() => ({headerShown: false})} />
      <MenuStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} options={() => ({headerShown: false})} />
    </MenuStack.Navigator>
  );
};

export const MenuScreen = (queryCache: QueryCache, avalancheCenterId: AvalancheCenterID, staging: boolean, setStaging: React.Dispatch<React.SetStateAction<boolean>>) => {
  const toggleStaging = React.useCallback(() => {
    setStaging(!staging);

    console.log(`Switching to ${staging ? 'production' : 'staging'} environment`);
  }, [staging, setStaging]);
  const navigation = useNavigation<MenuStackNavigationProps>();
  return function (_: NativeStackScreenProps<MenuStackParamList, 'menu'>) {
    return (
      <SafeAreaView style={styles.fullscreen}>
        <VStack pt={16} px={16} space={16} style={styles.fullscreen}>
          <FeatureTitleBlack>Settings</FeatureTitleBlack>
          <BodyBlack>
            Version: {Application.nativeApplicationVersion} Build Version: {Application.nativeBuildVersion}
          </BodyBlack>
          <Divider />
          <Button
            buttonStyle="primary"
            onPress={() => {
              AsyncStorage.clear();
              queryCache.clear();
            }}>
            <Body>Reset the query cache</Body>
          </Button>
          {Updates.channel !== 'production' && (
            <VStack space={16}>
              <Title1Black>Debug Settings</Title1Black>
              <HStack justifyContent="space-between" alignItems="center" space={16}>
                <BodyBlack>Use staging environment</BodyBlack>
                <Switch value={staging} onValueChange={toggleStaging} />
              </HStack>
              <ActionList
                actions={[
                  {
                    label: 'Choose avalanche center',
                    data: 'Avalanche Center Selector',
                    action: () => {
                      navigation.navigate('avalancheCenterSelector');
                    },
                  },
                ]}
              />
              <Title1Black>Design Previews</Title1Black>
              <ActionList
                actions={[
                  {
                    label: 'Open text style preview',
                    data: 'Text Style Preview',
                    action: () => {
                      navigation.navigate('textStylePreview');
                    },
                  },
                ]}
              />
              <Title1Black>Quality Assurance Links</Title1Black>
              <ActionList
                actions={[
                  {
                    label: 'View map layer with active warning',
                    data: 'Map Layer With Active Warning',
                    action: () => {
                      navigation.navigate('avalancheCenter', {
                        center_id: 'NWAC',
                        requestedTime: toISOStringUTC(new Date('2023-02-20T12:21:00-0800')),
                      });
                    },
                  },
                  {
                    label: 'View forecast with active warning',
                    data: 'Forecast With Active Warning',
                    action: () => {
                      navigation.navigate('forecast', {
                        zoneName: 'West Slopes Central',
                        center_id: 'NWAC',
                        forecast_zone_id: 1130,
                        requestedTime: toISOStringUTC(new Date('2023-02-20T12:21:00-0800')),
                      });
                    },
                  },
                ]}
              />
            </VStack>
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
        style={{paddingHorizontal: 4}}
        sections={data}
        keyExtractor={item => item.content}
        renderItem={({item}) => <item.Component>{item.content}</item.Component>}
        renderSectionHeader={() => <View height={4} />}
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
