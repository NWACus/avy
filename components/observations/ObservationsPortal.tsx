import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Topo from 'assets/illustrations/topo.svg';
import {Button} from 'components/content/Button';
import {QueryState, incompleteQueryState} from 'components/content/QueryState';
import {VStack, View} from 'components/core';
import {Body, BodyBlack, Title3Black} from 'components/text';
import {useAvalancheCenterCapabilities} from 'hooks/useAvalancheCenterCapabilities';
import {usePostHog} from 'posthog-react-native';
import React, {useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ObservationsStackNavigationProps} from 'routes';
import {AvalancheCenterID, userFacingCenterId} from 'types/nationalAvalancheCenter';
import {RequestedTime, formatRequestedTime} from 'utils/date';

export const ObservationsPortal: React.FC<{
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
}> = ({center_id, requestedTime}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const onViewAll = useCallback(
    () => navigation.navigate('observationsList', {center_id, requestedTime: formatRequestedTime(requestedTime)}),
    [center_id, navigation, requestedTime],
  );
  const onSubmit = useCallback(() => navigation.navigate('observationSubmit'), [navigation]);
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    postHog?.screen('observationsPortal', {
      center: center_id,
    });
  }, [postHog, center_id]);
  useFocusEffect(recordAnalytics);

  const capabilitiesResult = useAvalancheCenterCapabilities();
  const capabilities = capabilitiesResult.data;

  if (incompleteQueryState(capabilitiesResult) || !capabilities) {
    return <QueryState results={[capabilitiesResult]} />;
  }

  return (
    <View width="100%" height="100%" bg="#F6F8FC">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%', position: 'relative'}}>
        {/* these magic numbers are yanked out of Figma. They could probably be converted to percentages */}
        <Topo width={887.0152587890625} height={456.3430480957031} style={{position: 'absolute', left: -306.15625, bottom: -60}} />
        <VStack height="100%" width="100%" justifyContent="center" alignItems="stretch" space={16} px={32} pb={200}>
          <Title3Black textAlign="center">You haven&apos;t submitted any observations in the App yet</Title3Black>
          <Body textAlign="center">Help keep the {userFacingCenterId(center_id, capabilities)} community informed by submitting your observation.</Body>
          <Button buttonStyle="primary" onPress={onSubmit}>
            <BodyBlack>Submit an observation</BodyBlack>
          </Button>
          <Button onPress={onViewAll}>
            <BodyBlack>View all observations</BodyBlack>
          </Button>
        </VStack>
      </SafeAreaView>
    </View>
  );
};
