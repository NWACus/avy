import {Button} from 'components/content/Button';
import {View, VStack} from 'components/core';
import {Body, BodyBlack, FeatureTitleBlack} from 'components/text';
import React, {ReactNode} from 'react';
import {GestureResponderEvent} from 'react-native';

export interface OutcomeOptions {
  headline: string; // the main outcome to show the user
  body: string; // some explanatory text
  illustration: ReactNode;
  illustrationBottomMargin?: number;
  illustrationLeftMargin?: number;
  inline?: boolean;
  onRetry?: (event: GestureResponderEvent) => void; // action to bind to the retry button
  onClose?: (event: GestureResponderEvent) => void; // action to bind to the close button
}

export const Outcome: React.FunctionComponent<OutcomeOptions> = ({
  headline,
  body,
  illustration,
  illustrationBottomMargin = 0,
  illustrationLeftMargin = 0,
  inline,
  onRetry,
  onClose,
}) => {
  return (
    <View style={inline ? {} : {height: '100%', width: '100%'}} bg="white" pb={32}>
      <VStack justifyContent={'center'} flex={inline ? 0 : 1}>
        <View mx={16}>
          <VStack space={24} alignItems={'center'}>
            <View mb={illustrationBottomMargin} ml={illustrationLeftMargin}>
              {illustration}
            </View>
            <FeatureTitleBlack textAlign="center">{headline}</FeatureTitleBlack>
            <Body>{body}</Body>
            {onRetry && (
              <Button width={'100%'} buttonStyle="primary" onPress={onRetry}>
                <BodyBlack>Retry</BodyBlack>
              </Button>
            )}
            {onClose && (
              <Button width={'100%'} buttonStyle={onRetry ? 'normal' : 'primary'} onPress={onClose}>
                <BodyBlack>Close</BodyBlack>
              </Button>
            )}
          </VStack>
        </View>
      </VStack>
    </View>
  );
};
