import log, {logFilePath} from 'logger';
import React, {ReactNode} from 'react';

import {ScrollView, SectionList, StyleSheet, Switch} from 'react-native';
import Toast from 'react-native-root-toast';
import {SafeAreaView} from 'react-native-safe-area-context';

import {AvalancheCenterSelector} from 'components/AvalancheCenterSelector';

import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {MenuStackNavigationProps, MenuStackParamList, TabNavigatorParamList} from 'routes';

import {HStack, View, VStack} from 'components/core';

import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as MailComposer from 'expo-mail-composer';
import * as Updates from 'expo-updates';

import {QueryCache} from '@tanstack/react-query';
import {ActionList} from 'components/content/ActionList';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {ConnectionLost, InternalError, NotFound} from 'components/content/QueryState';
import {TableRow} from 'components/observations/ObservationDetailView';
import {clearUploadCache} from 'components/observations/submitObservation';
import {ForecastScreen} from 'components/screens/ForecastScreen';
import {MapScreen} from 'components/screens/MapScreen';
import {NWACObservationScreen, ObservationScreen} from 'components/screens/ObservationsScreen';
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
      <MenuStack.Screen name="observation" component={ObservationScreen} />
      <MenuStack.Screen name="nwacObservation" component={NWACObservationScreen} />
      <MenuStack.Screen name="about" component={AboutScreen} options={() => ({title: 'About This App'})} />
      <MenuStack.Screen name="outcome" component={OutcomeScreen} options={() => ({headerShown: false})} />
      <MenuStack.Screen name="expoConfig" component={ExpoConfigScreen} />
    </MenuStack.Navigator>
  );
};

export const MenuScreen = (queryCache: QueryCache, avalancheCenterId: AvalancheCenterID, staging: boolean, setStaging: React.Dispatch<React.SetStateAction<boolean>>) => {
  const toggleStaging = React.useCallback(() => {
    setStaging(!staging);

    log.info(`Switching to ${staging ? 'production' : 'staging'} environment`);
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
                      <VStack space={12}>
                        <Button
                          buttonStyle="normal"
                          onPress={async () => {
                            if (await MailComposer.isAvailableAsync()) {
                              MailComposer.composeAsync({
                                recipients: ['developer@nwac.us'],
                                subject: 'NWAC app log files',
                                attachments: [logFilePath],
                              });
                            } else {
                              Toast.show('Email is not configured!', {
                                duration: Toast.durations.LONG,
                                position: Toast.positions.BOTTOM,
                                shadow: true,
                                animation: true,
                                hideOnPress: true,
                                delay: 0,
                              });
                            }
                          }}>
                          <Body>Email log file</Body>
                        </Button>
                        <Button
                          buttonStyle="normal"
                          onPress={() => {
                            AsyncStorage.clear();
                            queryCache.clear();
                            clearUploadCache();
                          }}>
                          <Body>Reset the query cache</Body>
                        </Button>
                        <HStack justifyContent="space-between" alignItems="center" space={16}>
                          <Body>Use staging environment</Body>
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
                            {
                              label: 'View Expo configuration',
                              data: 'Expo Configuration',
                              action: () => {
                                navigation.navigate('expoConfig');
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
                            data: null,
                            action: () => {
                              navigation.navigate('avalancheCenter', {
                                center_id: 'NWAC',
                                requestedTime: toISOStringUTC(new Date('2023-02-20T12:21:00-0800')),
                              });
                            },
                          },
                          {
                            label: 'View forecast with active warning',
                            data: null,
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
                            data: null,
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
                    <Card borderRadius={0} borderColor="white" header={<Title3Black>Observations</Title3Black>}>
                      <ActionList
                        actions={[
                          {
                            label: '1: simple',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: '65450a80-1f57-468b-a51e-8c19789e0fab',
                              });
                            },
                          },
                          {
                            label: '2: simple',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: '249e927f-aa0e-4e93-90fc-c9a54bc480d8',
                              });
                            },
                          },
                          {
                            label: '3: simple: icons',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: '441f400b-56ac-498c-8754-f9d407796a82',
                              });
                            },
                          },
                          {
                            label: '4: complex: weather',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: 'b8d347d1-7597-47be-9247-adc117100a69',
                              });
                            },
                          },
                          {
                            label: '5: complex: weather, snowpack',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: '2d2f37b4-f46b-4ef2-967d-b018d41d0f2d',
                              });
                            },
                          },
                          {
                            label: '6: complex: snowpack',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: '999d1e0c-154e-43f8-b15f-6585eac4d985',
                              });
                            },
                          },
                          {
                            label: '7: complex: avalanches',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: '4b80e7fc-0011-4fdf-8d86-f2534c1d981c',
                              });
                            },
                          },
                          {
                            label: '8: complex: avalanches',
                            data: null,
                            action: () => {
                              navigation.navigate('observation', {
                                id: '5910e9e7-fe6e-46de-af08-9df9be9192e2',
                              });
                            },
                          },
                          {
                            label: 'NWAC pro observation with avalanches',
                            data: null,
                            action: () => {
                              navigation.navigate('nwacObservation', {
                                id: '20312',
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
        <Card marginTop={8} borderRadius={0} borderColor="white" header={<Title3Black>Versions</Title3Black>}>
          <TableRow label="Application Version" value={Application.nativeApplicationVersion || 'unknown'} />
          <TableRow label="Build Version" value={Application.nativeBuildVersion || 'unknown'} />
          <TableRow label="Runtime Version" value={Updates.runtimeVersion || 'unknown'} />
        </Card>
        <Card borderRadius={0} borderColor="white" header={<Title3Black>Updates</Title3Black>}>
          <TableRow label="Release Channel" value={Updates.releaseChannel || 'unknown'} />
          <TableRow label="Update Version" value={Updates.channel || 'unknown'} />
          <TableRow label="Update Group ID" value={Constants.manifest2?.metadata?.['updateGroup'] || 'unknown'} />
          <TableRow label="Update ID" value={Updates.updateId || 'unknown'} />
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

export const ExpoConfigScreen = (_: NativeStackScreenProps<MenuStackParamList, 'expoConfig'>) => {
  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject} edges={['top', 'left', 'right']}>
      <ScrollView>
        <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Expo Configuration</Title3Black>}>
          <Body>{JSON.stringify(Constants.expoConfig, null, 2)}</Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
  },
});
