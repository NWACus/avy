/* eslint-disable react/jsx-no-bind */
// We normally want to avoid using fat arrow functions in props as it can cause excessive re-rendering,
// but for the debug menu we shouldn't be too worried about it. It never renders in production.

import React, {ReactNode, useCallback} from 'react';

import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {Platform, ScrollView, SectionList, StyleSheet, Switch, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {MenuStackNavigationProps, MenuStackParamList, TabNavigationProps} from 'routes';

import {Divider, HStack, View, VStack} from 'components/core';

import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Updates from 'expo-updates';

import {useQueryClient} from '@tanstack/react-query';
import {ClientContext} from 'clientContext';
import {AvalancheProblemSizeLine} from 'components/AvalancheProblemSizeLine';
import {ActionList} from 'components/content/ActionList';
import {Button} from 'components/content/Button';
import {Card, CollapsibleCard} from 'components/content/Card';
import {ConnectionLost, InternalError, NotFound} from 'components/content/QueryState';
import {ActionToast, ErrorToast, InfoToast, SuccessToast, WarningToast} from 'components/content/Toast';
import {getUploader} from 'components/observations/uploader/ObservationsUploader';
import {Keys} from 'components/screens/menu/Keys';
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
import {QUERY_CACHE_ASYNC_STORAGE_KEY} from 'data/asyncStorageKeys';
import {clearCampaignViewData} from 'data/campaigns/campaignManager';
import {logFilePath, logger} from 'logger';
import {sendMail} from 'network/sendMail';
import {usePreferences} from 'Preferences';
import Toast from 'react-native-toast-message';
import {colorLookup} from 'theme';
import {RequestedTime, requestedTimeToUTCDate, toISOStringUTC} from 'utils/date';

interface SecretMenuProps {
  staging: boolean;
  setStaging: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SecretMenu: React.FC<SecretMenuProps> = ({staging, setStaging}) => {
  const navigation = useNavigation<MenuStackNavigationProps>();
  const queryCache = useQueryClient().getQueryCache();
  const toggleStaging = React.useCallback(() => {
    setStaging(!staging);

    logger.info({environment: staging ? 'production' : 'staging'}, 'switching environment');
  }, [staging, setStaging]);
  const {preferences, setPreferences, clearPreferences} = usePreferences();
  return (
    <CollapsibleCard
      startsCollapsed={preferences.secretMenuCollapsed}
      collapsedStateChanged={collapsed => setPreferences({secretMenuCollapsed: collapsed})}
      borderColor="white"
      header={<BodyBlack>Secret Menu 🤫</BodyBlack>}>
      <VStack space={4}>
        <Card borderRadius={0} borderColor="white" header={<BodyBlack>Debug Settings</BodyBlack>}>
          <VStack space={12}>
            <ActionList
              bg="white"
              pl={16}
              actions={[
                {
                  label: 'Select avalanche center (debug)',
                  data: 'Center (debug)',
                  action: () => {
                    navigation.navigate('avalancheCenterSelector', {debugMode: true});
                  },
                },
                {
                  label: 'Time machine',
                  data: 'timeMachine',
                  action: () => {
                    navigation.navigate('timeMachine');
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
            <HStack alignItems="center" justifyContent={'space-between'} space={16}>
              <Button
                buttonStyle="normal"
                // this is disabled on iOS and enabled on Android,
                // since we don't have proper attachment support on iOS
                // https://github.com/expo/expo/issues/24613
                disabled={Platform.OS === 'ios'}
                onPress={() => {
                  void (async () => {
                    if (
                      !(await sendMail({
                        to: 'developer+app-logs@nwac.us',
                        subject: 'NWAC app log files',
                        body: `\n\n---\n\nRun \`yarn bunyan ${logFilePath.split('/').slice(-1)[0]}\` to view.\nRun \`yarn bunyan --help\` for additional options.`,
                        attachments: [logFilePath],
                        logger,
                      }))
                    ) {
                      Toast.show({
                        type: 'error',
                        text1: 'Email is not configured!',
                        position: 'bottom',
                      });
                    }
                  })();
                }}>
                Email log file
              </Button>
              <Button
                buttonStyle="normal"
                onPress={() => {
                  void (async () => {
                    const log = await FileSystem.readAsStringAsync(logFilePath);
                    await Clipboard.setStringAsync(log);
                  })();
                }}>
                Copy log to clipboard
              </Button>
            </HStack>
            <Button
              buttonStyle="normal"
              onPress={() => {
                void (async () => {
                  await AsyncStorage.removeItem(QUERY_CACHE_ASYNC_STORAGE_KEY);
                  queryCache.clear();
                })();
              }}>
              Reset the query cache
            </Button>
            <Button buttonStyle="normal" onPress={() => void clearPreferences()}>
              Reset preferences
            </Button>
            <Button buttonStyle="normal" onPress={() => void clearCampaignViewData()}>
              Reset campaign view data
            </Button>
            <Button buttonStyle="normal" onPress={() => void Updates.reloadAsync()}>
              Restart app
            </Button>
            <HStack justifyContent="space-between" alignItems="center" space={16}>
              <Body>Use staging environment</Body>
              <Switch value={staging} onValueChange={toggleStaging} />
            </HStack>
          </VStack>
        </Card>
        <Card borderRadius={0} borderColor="white" header={<BodyBlack>Keys</BodyBlack>}>
          <Keys />
        </Card>
        <Card borderRadius={0} borderColor="white" header={<BodyBlack>Observation Uploader</BodyBlack>}>
          <VStack space={12}>
            <Button buttonStyle="normal" onPress={() => logger.info({stats: getUploader().getState()}, 'ObservationUploader state')}>
              Dump state to log
            </Button>
            <Button buttonStyle="normal" onPress={() => void getUploader().resetTaskQueue()}>
              Reset the observation uploader
            </Button>
          </VStack>
        </Card>
        <Card borderRadius={0} borderColor="white" header={<BodyBlack>Sentry</BodyBlack>}>
          <VStack space={4}>
            <Body>Config</Body>
            {(() => {
              const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
              return (
                <BodySm fontFamily={Platform.select({ios: 'Courier New', android: 'monospace'})} color={colorLookup(dsn ? 'text' : 'red')}>
                  SENTRY_DSN: {dsn ? `${dsn.slice(0, 15)}...` : 'not supplied'}
                </BodySm>
              );
            })()}
            <ActionList
              actions={[
                {
                  label: 'Trigger exception',
                  data: 'Button Style Preview',
                  action: () => {
                    throw new Error('Test error');
                  },
                },
              ]}
            />
          </VStack>
        </Card>
        <ActionList
          header={<BodyBlack>Design Previews</BodyBlack>}
          bg="white"
          pl={16}
          actions={[
            {
              label: 'Open button style preview',
              data: 'Button Style Preview',
              action: () => {
                navigation.navigate('buttonStylePreview');
              },
            },
            {
              label: 'Open text style preview',
              data: 'Text Style Preview',
              action: () => {
                navigation.navigate('textStylePreview');
              },
            },
            {
              label: 'Open toast preview',
              data: 'Toast Preview',
              action: () => {
                navigation.navigate('toastPreview');
              },
            },
            {
              label: 'Open avalanche component preview',
              action: () => {
                navigation.navigate('avalancheComponentPreview');
              },
              data: undefined,
            },
          ]}
        />
        <ActionList
          header={<BodyBlack>Screens</BodyBlack>}
          bg="white"
          pl={16}
          actions={[
            {
              label: 'View map layer with active warning',
              data: null,
              action: () => {
                navigation.navigate('avalancheCenter', {
                  center_id: 'NWAC',
                  requestedTime: toISOStringUTC(new Date('2023-02-20T5:21:00-0800')),
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
                  requestedTime: toISOStringUTC(new Date('2023-02-20T5:21:00-0800')),
                });
              },
            },
            {
              label: 'View forecast with active watch',
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'Northwest Mountains',
                  center_id: 'CBAC',
                  forecast_zone_id: 298,
                  requestedTime: toISOStringUTC(new Date('2023-03-21T5:21:00-0800')),
                });
              },
            },
            {
              label: 'View forecast with active special bulletin',
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'Northwest Mountains',
                  center_id: 'CBAC',
                  forecast_zone_id: 298,
                  requestedTime: toISOStringUTC(new Date('2022-02-25T5:21:00-0800')),
                });
              },
            },
            {
              label: 'View forecast with synopsis', // TODO(skuznets): move this to BTAC or something that uses blogs still
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'West Slopes Central',
                  center_id: 'NWAC',
                  forecast_zone_id: 1130,
                  requestedTime: toISOStringUTC(new Date('2022-04-10T5:21:00-0800')),
                });
              },
            },
            // TODO(skuznets): choose a recent forecast that's a summary
            {
              label: 'View forecast with standard row/column weather forecast',
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'Galena Summit & Eastern Mtns',
                  center_id: 'SNFAC',
                  forecast_zone_id: 714,
                  requestedTime: toISOStringUTC(new Date('2023-04-13T5:21:00-0800')),
                });
              },
            },
            {
              label: 'View forecast with custom row/column weather forecast',
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'Tetons',
                  center_id: 'BTAC',
                  forecast_zone_id: 1329,
                  requestedTime: toISOStringUTC(new Date('2023-05-01T21:21:00-0000')),
                });
              },
            },
            {
              label: 'View forecast with another custom row/column weather forecast',
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'Central Sierra Nevada',
                  center_id: 'SAC',
                  forecast_zone_id: 77,
                  requestedTime: toISOStringUTC(new Date('2023-04-08T14:21:00-0000')),
                });
              },
            },
            {
              label: 'View forecast with inline weather forecast',
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'Galena Summit & Eastern Mtns',
                  center_id: 'SNFAC',
                  forecast_zone_id: 714,
                  requestedTime: toISOStringUTC(new Date('2020-04-08T5:21:00-0800')),
                });
              },
            },
            {
              label: 'View expired forecast',
              data: null,
              action: () => {
                navigation.navigate('forecast', {
                  zoneName: 'West Slopes Central',
                  center_id: 'NWAC',
                  forecast_zone_id: 1130,
                  requestedTime: toISOStringUTC(new Date('2023-02-01T5:21:00-0800')),
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
        <ActionList
          header={<BodyBlack>Observations</BodyBlack>}
          bg="white"
          pl={16}
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
        <ActionList
          header={<BodyBlack>Components</BodyBlack>}
          bg="white"
          pl={16}
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
      </VStack>
    </CollapsibleCard>
  );
};

export const ButtonStylePreview = () => (
  <VStack width="100%" height="100%" space={32} px={32} alignItems="stretch" justifyContent="center">
    <Button buttonStyle="primary" onPress={() => undefined}>
      <BodyBlack>Primary button</BodyBlack>
    </Button>
    <Button buttonStyle="primary" disabled onPress={() => undefined}>
      <BodyBlack>Primary button (disabled)</BodyBlack>
    </Button>
    <Button buttonStyle="normal" onPress={() => undefined}>
      <BodyBlack>Normal button</BodyBlack>
    </Button>
    <Button buttonStyle="normal" disabled onPress={() => undefined}>
      <BodyBlack>Normal button (disabled)</BodyBlack>
    </Button>
    <Button buttonStyle="destructive" onPress={() => undefined}>
      <BodyBlack>Destructive button</BodyBlack>
    </Button>
    <Button buttonStyle="destructive" disabled onPress={() => undefined}>
      <BodyBlack>Destructive button (disabled)</BodyBlack>
    </Button>
  </VStack>
);

export const TextStylePreview = () => {
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

export const ToastPreview = () => {
  return (
    <SafeAreaView style={styles.fullscreen}>
      <VStack space={12} my={20} py={16}>
        <TouchableOpacity
          onPress={() =>
            Toast.show({
              type: 'success',
              text1: 'Thank you for your submission',
              position: 'bottom',
            })
          }>
          <SuccessToast content={'Thank you for your submission'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Toast.show({
              type: 'info',
              text1: 'Informational content here',
              position: 'bottom',
            })
          }>
          <InfoToast content={'Informational content here'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Toast.show({
              type: 'action',
              text1: 'You must complete...',
              position: 'bottom',
            })
          }>
          <ActionToast content={'You must complete...'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Toast.show({
              type: 'error',
              text1: 'This forecast has expired...',
              position: 'bottom',
            })
          }>
          <ErrorToast content={'This forecast has expired...'} />
        </TouchableOpacity>
        <ErrorToast
          content={'Persistent toast'}
          onPress={() =>
            Toast.show({
              type: 'error',
              text1: 'Persistent toast',
              position: 'bottom',
              autoHide: false,
              onPress: () => Toast.hide(),
            })
          }
        />
        <TouchableOpacity
          onPress={() =>
            Toast.show({
              type: 'warning',
              text1: 'Could not fetch...',
              position: 'bottom',
            })
          }>
          <WarningToast content={'Could not fetch...'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Toast.show({
              type: 'error',
              text1: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt...',
              position: 'bottom',
            })
          }>
          <ErrorToast content={'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt...'} />
        </TouchableOpacity>
      </VStack>
    </SafeAreaView>
  );
};

export const AvalancheComponentPreview = () => {
  return (
    <SafeAreaView style={styles.fullscreen}>
      <ScrollView style={{width: '100%', height: '100%'}}>
        <VStack space={4} p={8}>
          {[
            [1, 1],
            [1, 1.5],
            [1, 2],
            [1.5, 2.5],
            [2, 3],
            [2, 4],
            [2, 5],
          ].map((size, index) => (
            <HStack alignItems="center" justifyContent="space-around" px={16} key={index}>
              <BodyBlack>
                D{size[0]} - D{size[1]}
              </BodyBlack>
              <AvalancheProblemSizeLine size={size} />
            </HStack>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export const TimeMachine = () => {
  const navigation = useNavigation<TabNavigationProps>();
  const {requestedTime, setRequestedTime} = React.useContext(ClientContext);
  const changeTime = useCallback(
    (time: RequestedTime) => {
      setRequestedTime(time);
      // We need to clear navigation state to force all screens from the
      // previous time to unmount
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    },
    [navigation, setRequestedTime],
  );
  const onDateSelected = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set') {
        changeTime(date || 'latest');
      }
    },
    [changeTime],
  );
  return (
    <VStack space={16} px={16} py={16}>
      <Button buttonStyle="primary" onPress={() => changeTime('latest')}>
        Today
      </Button>
      <DateTimePicker value={requestedTimeToUTCDate(requestedTime)} mode="date" display="inline" onChange={onDateSelected} />
      <Divider />
      <BodyBlack>Other interesting days</BodyBlack>
      <Button buttonStyle="normal" onPress={() => changeTime(new Date('2023-02-20T5:21:00-0800'))}>
        2/20/2023 - Active warning day
      </Button>
      <Button buttonStyle="normal" onPress={() => changeTime(new Date(2023, 2, 1))}>
        3/1/2023 - random winter day
      </Button>
    </VStack>
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
    <View width="100%" height="100%">
      {outcome}
    </View>
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
