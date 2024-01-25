import {AntDesign} from '@expo/vector-icons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {FeatureFlagKey, FeatureFlagValue, useDebugFeatureFlags, useOneFeatureFlag} from 'FeatureFlags';
import {Card} from 'components/content/Card';
import {HStack} from 'components/core';
import {Body, BodySmBlack, Caption1Semibold} from 'components/text';
import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MenuStackParamList} from 'routes';
import {colorLookup} from 'theme';

export const FeatureFlagsDebuggerScreen = (_: NativeStackScreenProps<MenuStackParamList, 'featureFlags'>) => {
  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject} edges={['top', 'left', 'right']}>
      <FeatureFlagsDebugger />
    </SafeAreaView>
  );
};

export const FeatureFlagsDebugger: React.FunctionComponent = () => {
  const {featureFlags} = useDebugFeatureFlags();
  const keys = Object.keys(featureFlags).map(flag => ({flag: flag}));
  const render = useCallback((info: {item: {flag: FeatureFlagKey}}) => {
    return <FeatureFlagCard flag={info.item.flag} />;
  }, []);
  return <FlatList data={keys} renderItem={render} />;
};

const FeatureFlagCard: React.FunctionComponent<{flag: FeatureFlagKey}> = ({flag}) => {
  const [enableOverride, setEnableOverride] = useState<boolean>(false);
  const {featureFlags, clientSideFeatureFlagOverrides, setClientSideFeatureFlagOverrides} = useDebugFeatureFlags();

  const serverFeatureFlag = featureFlags[flag];
  const clientFeatureFlag = clientSideFeatureFlagOverrides[flag];
  const resolvedFeatureFlag = useOneFeatureFlag(flag);

  const toggleEnableOverride = useCallback(() => setEnableOverride(value => !value), [setEnableOverride]);
  const toggleClientOverride = useCallback(
    () =>
      setClientSideFeatureFlagOverrides(featureFlags => {
        return {
          ...featureFlags,
          [flag]: !featureFlags[flag],
        };
      }),
    [flag, setClientSideFeatureFlagOverrides],
  );
  useEffect(() => {
    if (!enableOverride) {
      setClientSideFeatureFlagOverrides(featureFlags => {
        const {[flag]: _, ...rest} = featureFlags;
        return rest;
      });
    }
  }, [flag, enableOverride, setClientSideFeatureFlagOverrides]);

  return (
    <Card
      mx={2}
      my={2}
      py={4}
      borderRadius={10}
      borderColor={colorLookup('light.300')}
      borderWidth={1}
      header={
        <HStack alignContent="flex-start" justifyContent="space-between" flexWrap="wrap" alignItems="center" space={8}>
          <BodySmBlack>{flag}</BodySmBlack>
          <HStack space={4} alignItems="center">
            <HStack space={2} alignItems="center">
              <Caption1Semibold>Server:</Caption1Semibold>
              <FeatureFlagIcon value={serverFeatureFlag} />
            </HStack>
            <HStack space={2} alignItems="center">
              <Caption1Semibold>Client:</Caption1Semibold>
              <FeatureFlagIcon value={clientFeatureFlag} />
            </HStack>
            <HStack space={2} alignItems="center">
              <Caption1Semibold>Resolved:</Caption1Semibold>
              <FeatureFlagIcon value={resolvedFeatureFlag} />
            </HStack>
          </HStack>
        </HStack>
      }>
      <HStack alignContent="center" justifyContent="center" flexWrap="wrap" alignItems="center" space={18}>
        <HStack space={2} alignItems="center">
          <Body>Override?</Body>
          <Switch value={enableOverride} onValueChange={toggleEnableOverride} />
        </HStack>
        <HStack space={2} alignItems="center">
          <Body>Value:</Body>
          {typeof serverFeatureFlag === 'boolean' && <Switch disabled={!enableOverride} value={Boolean(clientFeatureFlag)} onValueChange={toggleClientOverride} />}
          {typeof serverFeatureFlag === 'string' && <Body>TODO: handle string flags</Body>}
        </HStack>
      </HStack>
    </Card>
  );
};

const FeatureFlagIcon: React.FunctionComponent<{value: FeatureFlagValue | undefined}> = ({value}) => {
  if (value === undefined) {
    return <AntDesign name="questioncircleo" size={16} color={colorLookup('general_information')} />;
  }
  if (typeof value === 'boolean') {
    if (value) {
      return <AntDesign name="checkcircle" size={16} color={colorLookup('success')} />;
    } else {
      return <AntDesign name="closecircle" size={16} color={colorLookup('error')} />;
    }
  }
  return <AntDesign name="infocirlceo" size={16} color={colorLookup('primary')} />;
};
