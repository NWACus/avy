import {Button} from 'components/content/Button';
import {View, VStack} from 'components/core';
import {Body} from 'components/text';
import React from 'react';

interface MediaLoadErrorView {
  message: string;
  onRetry: () => void;
}

export const MediaLoadErrorView: React.FunctionComponent<MediaLoadErrorView> = ({message, onRetry}) => {
  return (
    <View flex={1} alignContent="center" justifyContent="center">
      <VStack padding={8} space={16}>
        <Body textAlign="center" color={'white'}>
          {message}
        </Body>
        <View alignItems="center">
          <Button onPress={onRetry} buttonStyle="primary">
            Retry
          </Button>
        </View>
      </VStack>
    </View>
  );
};
