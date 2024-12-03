import React from 'react';
import {TouchableOpacity} from 'react-native';

import {HStack, VStack, View} from 'components/core';
import {Body} from 'components/text';
import {useToggle} from 'hooks/useToggle';

const keys = [
  {name: 'EXPO_PUBLIC_SENTRY_DSN', value: process.env.EXPO_PUBLIC_SENTRY_DSN as string},
  {name: 'EXPO_PUBLIC_POSTHOG_API_KEY', value: process.env.EXPO_PUBLIC_POSTHOG_API_KEY as string},
  {name: 'EXPO_PUBLIC_MIXPANEL_TOKEN', value: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN as string},
];

export const Keys: React.FC = () => {
  const [displayValues, {toggle: toggleValues}] = useToggle(false);
  return (
    <TouchableOpacity onPress={toggleValues}>
      <VStack space={4} width="100%">
        {keys
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({name, value}) => {
            const hasValue = value != null && value.length > 0;
            return (
              <HStack key={name} space={4}>
                <View width={16} height={16} borderRadius={8} borderWidth={1} padding={1}>
                  <View width={12} height={12} borderRadius={6} backgroundColor={hasValue ? 'green' : 'red'} flex={1} />
                </View>
                <Body>{displayValues ? (hasValue ? value : '<<missing>>') : name}</Body>
              </HStack>
            );
          })}
      </VStack>
    </TouchableOpacity>
  );
  return <></>;
};
