import {useNavigation} from '@react-navigation/native';
import Topo from 'assets/topo.svg';
import {Button} from 'components/content/Button';
import {View, VStack} from 'components/core';
import {Body, BodySemibold} from 'components/text';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ObservationsStackNavigationProps} from 'routes';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {formatRequestedTime, RequestedTime} from 'utils/date';

export const ObservationsPortal: React.FC<{
  center_id: AvalancheCenterID;
  requestedTime: RequestedTime;
}> = ({center_id, requestedTime}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  return (
    <View width="100%" height="100%" bg="#F6F8FC">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%', position: 'relative'}}>
        {/* these magic numbers are yanked out of Figma. They could probably be converted to percentages */}
        <Topo width={887.0152587890625} height={456.3430480957031} style={{position: 'absolute', left: -306.15625, bottom: -60}} />
        <VStack height="100%" width="100%" justifyContent="center" alignItems="stretch" space={16} px={32} pb={200}>
          <Body textAlign="center">Help keep the {center_id} community informed by submitting your observation.</Body>
          <Button buttonStyle="primary" onPress={() => navigation.navigate('observationSubmit', {center_id})}>
            <BodySemibold>Submit an observation</BodySemibold>
          </Button>
          <Button onPress={() => navigation.navigate('observationsList', {center_id, requestedTime: formatRequestedTime(requestedTime)})}>
            <BodySemibold>View all observations</BodySemibold>
          </Button>
        </VStack>
      </SafeAreaView>
    </View>
  );
};
