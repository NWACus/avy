import {HStack, VStack, View} from 'components/core';
import {Body} from 'components/text';
import Constants from 'expo-constants';
import React from 'react';

const keys = [
  {name: 'EXPO_PUBLIC_SENTRY_DSN', value: process.env.EXPO_PUBLIC_SENTRY_DSN},
  {name: 'EXPO_PUBLIC_POSTHOG_API_KEY', value: process.env.EXPO_PUBLIC_POSTHOG_API_KEY},
  {name: 'EXPO_PUBLIC_MIXPANEL_TOKEN', value: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN},
  {name: 'IOS_GOOGLE_MAPS_API_KEY', value: Constants.expoConfig?.ios?.config?.googleMapsApiKey},
  {name: 'ANDROID_GOOGLE_MAPS_API_KEY', value: Constants.expoConfig?.android?.config?.googleMaps?.apiKey},
];

export const Keys: React.FC = () => {
  return (
    <VStack space={4} width="100%">
      {keys
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({name, value}) => (
          <HStack key={name} space={4}>
            <View width={16} height={16} borderRadius={8} borderWidth={1} padding={1}>
              <View width={12} height={12} borderRadius={6} backgroundColor={value != null ? 'green' : 'red'} flex={1} />
            </View>
            <Body>{name}</Body>
          </HStack>
        ))}
    </VStack>
  );
  return <></>;
};
