import React, {ReactNode} from 'react';

import {ScrollView, SectionList, StyleSheet, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {MenuStackNavigationProps, MenuStackParamList, TabNavigatorParamList} from 'routes';

import {HStack, View, VStack} from 'components/core';

import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

import {QueryCache} from '@tanstack/react-query';
import {ActionList} from 'components/content/ActionList';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {ConnectionLost, InternalError, NotFound} from 'components/content/QueryState';
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
import {colorLookup} from 'theme';
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
    <MenuStack.Navigator initialRouteName="menu" screenOptions={() => ({headerShown: false})}>
      <MenuStack.Screen name="menu" component={MenuScreen(queryCache, avalancheCenterId, staging, setStaging)} options={{title: `Settings`}} />
      <MenuStack.Screen
        name="avalancheCenterSelector"
        component={AvalancheCenterSelectorScreen(avalancheCenterId, setAvalancheCenter)}
        options={{title: `Choose An Avalanche Center`}}
      />
      <MenuStack.Screen name="textStylePreview" component={TextStylePreview} options={{title: `Text style preview`}} />
      <MenuStack.Screen name="avalancheCenter" component={MapScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} options={() => ({headerShown: false})} />
      <MenuStack.Screen name="forecast" component={ForecastScreen} initialParams={{center_id: center_id, requestedTime: requestedTime}} options={() => ({headerShown: false})} />
      <MenuStack.Screen name="about" component={AboutScreen} options={() => ({title: 'About This App'})} />
      <MenuStack.Screen name="outcome" component={OutcomeScreen} options={() => ({headerShown: false})} />
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
      <View style={{...StyleSheet.absoluteFillObject}} bg="white">
        {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
        <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
          <VStack width="100%" height="100%" justifyContent="space-between" alignItems="stretch" bg="background.base" pt={4} px={4} space={4}>
            <Card borderRadius={0} borderColor="white" header={<Title1Black>Menu</Title1Black>} noDivider noInternalSpace />
            <Card borderRadius={0} borderColor="white" header={<Title3Black>Settings</Title3Black>}>
              <ActionList
                actions={[
                  {
                    label: 'About this app',
                    data: 'About',
                    action: () => {
                      navigation.navigate('about');
                    },
                  },
                ]}
              />
            </Card>
            {Updates.channel !== 'production' && (
              <>
                <Card mb={4} borderRadius={0} borderColor="white" header={<Title1Black>Testing</Title1Black>} noDivider noInternalSpace />
                <ScrollView style={{width: '100%', height: '100%'}}>
                  <VStack space={4}>
                    <Card borderRadius={0} borderColor="white" header={<Title3Black>Debug Settings</Title3Black>}>
                      <VStack space={4}>
                        <HStack justifyContent="space-between" alignItems="center" space={16}>
                          <BodyBlack>Use staging environment</BodyBlack>
                          <Switch value={staging} onValueChange={toggleStaging} />
                        </HStack>
                        <Button
                          buttonStyle="primary"
                          onPress={() => {
                            AsyncStorage.clear();
                            queryCache.clear();
                          }}>
                          <Body>Reset the query cache</Body>
                        </Button>
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
                      </VStack>
                    </Card>
                    <Card borderRadius={0} borderColor="white" header={<Title3Black>Design Previews</Title3Black>}>
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
                    </Card>
                    <Card borderRadius={0} borderColor="white" header={<Title3Black>Screens</Title3Black>}>
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
                          {
                            label: "View a forecast we can't find",
                            data: 'Forecast With Not-Found Error',
                            action: () => {
                              navigation.navigate('forecast', {
                                zoneName: 'West Slopes Central',
                                center_id: 'NWAC',
                                forecast_zone_id: 1130,
                                requestedTime: toISOStringUTC(new Date('2000-01-01T00:00:00-0800')),
                              });
                            },
                          },
                        ]}
                      />
                    </Card>
                    <Card borderRadius={0} borderColor="white" header={<Title3Black>Components</Title3Black>}>
                      <ActionList
                        actions={[
                          {
                            label: 'View connection lost outcome',
                            data: 'Connection Lost',
                            action: () => {
                              navigation.navigate('outcome', {
                                which: 'connection',
                              });
                            },
                          },
                          {
                            label: 'View terminal error outcome',
                            data: 'Terminal Error',
                            action: () => {
                              navigation.navigate('outcome', {
                                which: 'terminal-error',
                              });
                            },
                          },
                          {
                            label: 'View retryable error outcome',
                            data: 'Retryable Error',
                            action: () => {
                              navigation.navigate('outcome', {
                                which: 'retryable-error',
                              });
                            },
                          },
                          {
                            label: 'View not found outcome',
                            data: 'Not Found',
                            action: () => {
                              navigation.navigate('outcome', {
                                which: 'not-found',
                              });
                            },
                          },
                        ]}
                      />
                    </Card>
                  </VStack>
                </ScrollView>
              </>
            )}
          </VStack>
        </SafeAreaView>
      </View>
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

export const AboutScreen = (_: NativeStackScreenProps<MenuStackParamList, 'about'>) => {
  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject} edges={['top', 'left', 'right']}>
      <VStack space={8} backgroundColor={colorLookup('background.base')} width="100%" height="100%">
        <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Version Information</Title3Black>}>
          <VStack space={16}>
            <HStack justifyContent="space-evenly" space={8}>
              <VStack space={4} style={{flex: 1}}>
                <AllCapsSmBlack>Version</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {Application.nativeApplicationVersion}
                </AllCapsSm>
              </VStack>
              <VStack space={4} style={{flex: 1}}>
                <AllCapsSmBlack>Build Version</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {Application.nativeBuildVersion}
                </AllCapsSm>
              </VStack>
            </HStack>
            <HStack justifyContent="space-evenly" space={8}>
              <VStack space={4} style={{flex: 1}}>
                <AllCapsSmBlack>Update Channel</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {Updates.channel || 'unknown'}
                </AllCapsSm>
              </VStack>
              <VStack space={4} style={{flex: 1}}>
                <AllCapsSmBlack>Release Channel</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {Updates.releaseChannel || 'unknown'}
                </AllCapsSm>
              </VStack>
            </HStack>
            <HStack justifyContent="space-evenly" space={8}>
              <VStack space={4} style={{flex: 1}}>
                <AllCapsSmBlack>Runtime Version</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {Updates.runtimeVersion || 'unknown'}
                </AllCapsSm>
              </VStack>
              <VStack space={4} style={{flex: 1}}>
                <AllCapsSmBlack>Update ID</AllCapsSmBlack>
                <AllCapsSm style={{textTransform: 'none'}} color="text.secondary">
                  {Updates.updateId || 'unknown'}
                </AllCapsSm>
              </VStack>
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </SafeAreaView>
  );
};

export const OutcomeScreen = ({route}: NativeStackScreenProps<MenuStackParamList, 'outcome'>) => {
  const {which} = route.params;
  let outcome: ReactNode = <View></View>;
  switch (which) {
    case 'connection':
      outcome = <ConnectionLost />;
      break;
    case 'terminal-error':
      outcome = <InternalError />;
      break;
    case 'retryable-error':
      outcome = <InternalError />;
      break;
    case 'not-found':
      outcome = <NotFound />;
      break;
  }
  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject} edges={['top', 'left', 'right']}>
      {outcome}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
  },
});
