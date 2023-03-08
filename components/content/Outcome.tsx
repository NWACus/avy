import {Button} from 'components/content/Button';
import {View, VStack} from 'components/core';
import {Body, BodySemibold, FeatureTitleBlack} from 'components/text';
import React, {ReactNode} from 'react';
import {GestureResponderEvent} from 'react-native';

export interface OutcomeOptions {
  outcome: string; // the main outcome to show the user
  reason: string; // some explanatory text
  illustration: ReactNode;
  onRetry?: (event: GestureResponderEvent) => void; // action to bind to the retry button
  onClose: (event: GestureResponderEvent) => void; // action to bind to the close button
}

export const Outcome: React.FunctionComponent<OutcomeOptions> = ({outcome, reason, illustration, onRetry, onClose}) => {
  return (
    <View style={{height: '100%', width: '100%'}} bg="white">
      <VStack justifyContent={'center'} flex={1}>
        <View mx={16}>
          <VStack space={24} alignItems={'center'}>
            {illustration}
            <VStack space={12} alignItems={'center'}>
              <FeatureTitleBlack>{outcome}</FeatureTitleBlack>
              <Body>{reason}</Body>
            </VStack>
            {onRetry && (
              <Button width={'100%'} buttonStyle="primary" onPress={onRetry}>
                <BodySemibold>Retry</BodySemibold>
              </Button>
            )}
            <Button width={'100%'} buttonStyle={onRetry ? 'normal' : 'primary'} onPress={onClose}>
              <BodySemibold>Close</BodySemibold>
            </Button>
          </VStack>
        </View>
      </VStack>
    </View>
  );
};
